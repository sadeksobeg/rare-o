"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminReorderCategoriesAction,
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type ActionResult,
} from "@/app/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { TextField } from "@/components/ui/text-field";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formErrorClass } from "@/lib/ui/form-classes";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";

export type CategoryRow = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  productCount: number;
  /** Core launch categories cannot be deleted. */
  isLaunch: boolean;
};

const initial: ActionResult | null = null;

/** AD-08 — categories table with Dialog create/edit and guarded delete. */
export function CategoriesManager({
  rows,
  dict,
  locale,
}: {
  rows: CategoryRow[];
  dict: Dictionary;
  locale: Locale;
}) {
  const u = dict.adminUi;
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; row: CategoryRow } | null
  >(null);
  const [nonce, setNonce] = useState(0);
  const [toDelete, setToDelete] = useState<CategoryRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  const [ordered, setOrdered] = useState(rows);
  const [dragId, setDragId] = useState<string | null>(null);
  const [reordering, startReorder] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setOrdered(rows);
  }, [rows]);

  function openDialog(next: NonNullable<typeof dialog>) {
    setNonce((n) => n + 1);
    setDialog(next);
  }

  function errorMessage(code: string): string {
    switch (code) {
      case "CATEGORY_HAS_PRODUCTS":
        return u.categoryDeleteBlocked;
      case "CATEGORY_LAUNCH":
        return u.categoryDeleteLaunch;
      case "CATEGORY_SLUG_EXISTS":
        return u.categorySlugExists;
      case "CATEGORY_INVALID":
        return u.categoryInvalid;
      default:
        return code;
    }
  }

  function confirmDelete() {
    if (!toDelete) return;
    const fd = new FormData();
    fd.set("id", toDelete.id);
    startDelete(async () => {
      const res = await deleteCategoryAction(fd);
      if (!res.ok) {
        setDeleteError(errorMessage(res.error));
        return;
      }
      setToDelete(null);
      setDeleteError(null);
    });
  }

  const display = (r: CategoryRow) =>
    locale === "ar" ? r.nameAr || r.nameEn : r.nameEn || r.nameAr;

  return (
    <div className="space-y-4">
      <div id="category-create" className="flex scroll-mt-20 justify-end">
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => openDialog({ mode: "create" })}
        >
          {u.categoryCreate}
        </Button>
      </div>

      {ordered.length === 0 ? (
        <EmptyState
          variant="first-use"
          title={u.emptyTitle}
          body={u.emptyBody}
          actionHref="#category-create"
          actionLabel={u.categoryCreate}
        />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ordered.map((r, index) => (
              <li
                key={r.id}
                draggable
                onDragStart={() => setDragId(r.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!dragId || dragId === r.id) return;
                  const from = ordered.findIndex((x) => x.id === dragId);
                  const to = index;
                  if (from < 0) return;
                  const next = [...ordered];
                  const [moved] = next.splice(from, 1);
                  next.splice(to, 0, moved!);
                  setOrdered(next);
                  setDragId(null);
                  const fd = new FormData();
                  for (const row of next) fd.append("ids", row.id);
                  startReorder(async () => {
                    await adminReorderCategoriesAction(fd);
                    router.refresh();
                  });
                }}
                className={cn(
                  "ro-portal-card cursor-grab border p-4 active:cursor-grabbing",
                  dragId === r.id && "opacity-60",
                  reordering && "pointer-events-none"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-display text-lg font-semibold text-ro-ink">
                      {display(r)}
                    </p>
                    <p className="text-xs text-ro-muted" dir="ltr">
                      {r.slug}
                    </p>
                    <p className="text-xs text-ro-muted">
                      {u.categoryProducts}: {r.productCount}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="flex size-12 items-center justify-center rounded-full bg-[var(--ro-plum-100)] font-display text-lg font-semibold text-[var(--ro-plum-900)]"
                  >
                    {(display(r) || "?").slice(0, 1)}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => openDialog({ mode: "edit", row: r })}
                  >
                    {dict.admin.edit}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={r.isLaunch || r.productCount > 0}
                    title={
                      r.isLaunch
                        ? u.categoryDeleteLaunch
                        : r.productCount > 0
                          ? u.categoryDeleteBlocked
                          : undefined
                    }
                    onClick={() => {
                      setDeleteError(null);
                      setToDelete(r);
                    }}
                  >
                    {u.categoryDelete}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? u.categoryEdit : u.categoryCreate}
        size="md"
      >
        {dialog ? (
          <CategoryForm
            key={nonce}
            mode={dialog.mode}
            row={dialog.mode === "edit" ? dialog.row : undefined}
            dict={dict}
            errorMessage={errorMessage}
            onDone={() => setDialog(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title={u.categoryDelete}
        body={
          deleteError
            ? deleteError
            : `${u.categoryDeleteConfirm}${toDelete ? ` — ${display(toDelete)}` : ""}`
        }
        confirmLabel={u.categoryDelete}
        cancelLabel={dict.common.cancel}
        pending={deleting}
      />
    </div>
  );
}

function CategoryForm({
  mode,
  row,
  dict,
  errorMessage,
  onDone,
}: {
  mode: "create" | "edit";
  row?: CategoryRow;
  dict: Dictionary;
  errorMessage: (code: string) => string;
  onDone: () => void;
}) {
  const u = dict.adminUi;
  const [state, action, pending] = useActionState(
    mode === "edit" ? updateCategoryAction : createCategoryAction,
    initial
  );
  const [dirty, setDirty] = useState(false);
  useUnsavedGuard(dirty);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form
      action={action}
      className="space-y-3"
      onChange={() => setDirty(true)}
    >
      {row ? <input type="hidden" name="id" value={row.id} /> : null}
      {mode === "create" ? (
        <TextField
          name="slug"
          label={u.categorySlug}
          dir="ltr"
          required
          dense
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
        />
      ) : (
        <p className="text-xs text-ro-muted" dir="ltr">
          {u.categorySlug}: {row?.slug}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          name="nameAr"
          label={u.categoryNameAr}
          defaultValue={row?.nameAr}
          dir="rtl"
          required
          dense
        />
        <TextField
          name="nameEn"
          label={u.categoryNameEn}
          defaultValue={row?.nameEn}
          dir="ltr"
          required
          dense
        />
      </div>
      <TextField
        name="sortOrder"
        type="number"
        min={0}
        max={100}
        label={u.categorySortOrder}
        defaultValue={String(row?.sortOrder ?? 0)}
        dir="ltr"
        dense
      />
      {state && !state.ok ? (
        <p role="alert" className={formErrorClass}>
          {errorMessage(state.error)}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" size="sm" onClick={onDone}>
          {dict.common.cancel}
        </Button>
        <Button type="submit" size="sm" loading={pending}>
          {u.categorySave}
        </Button>
      </div>
    </form>
  );
}
