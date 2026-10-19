"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type ActionResult,
} from "@/app/actions";
import {
  DataTable,
  DataTableHead,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { TextField } from "@/components/ui/text-field";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formErrorClass } from "@/lib/ui/form-classes";

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
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => openDialog({ mode: "create" })}
        >
          {u.categoryCreate}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={u.emptyBody} />
        </div>
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>{u.categorySortOrder}</Th>
            <Th>{u.categoryNameAr}</Th>
            <Th>{u.categoryNameEn}</Th>
            <Th>{u.categorySlug}</Th>
            <Th>{u.categoryProducts}</Th>
            <Th>{u.categoryActions}</Th>
          </DataTableHead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td className="tabular-nums">{r.sortOrder}</Td>
                <Td dir="rtl">
                  <span className="font-medium">{r.nameAr}</span>
                </Td>
                <Td dir="ltr">{r.nameEn}</Td>
                <Td dir="ltr" className="text-ro-muted">
                  {r.slug}
                </Td>
                <Td className="tabular-nums">{r.productCount}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-2">
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
                      aria-label={`${u.categoryDelete}: ${display(r)}`}
                      onClick={() => {
                        setDeleteError(null);
                        setToDelete(r);
                      }}
                    >
                      {u.categoryDelete}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
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

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-3">
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
