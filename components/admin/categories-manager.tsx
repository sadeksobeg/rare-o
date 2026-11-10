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
import { ArrowDown, ArrowUp, GripVertical, Tags } from "lucide-react";
import {
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  Pill,
} from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { TextField } from "@/components/ui/text-field";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
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
  const [savedFlash, setSavedFlash] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setOrdered(rows);
  }, [rows]);

  function persistOrder(next: CategoryRow[]) {
    setOrdered(next);
    const fd = new FormData();
    for (const row of next) fd.append("ids", row.id);
    startReorder(async () => {
      await adminReorderCategoriesAction(fd);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1800);
      router.refresh();
    });
  }

  function moveRow(id: string, direction: -1 | 1) {
    const from = ordered.findIndex((x) => x.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ordered.length) return;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    persistOrder(next);
  }

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

  const reorderHint =
    locale === "ar"
      ? "اسحب من المقبض أو استخدم الأسهم لإعادة الترتيب — يُحفظ تلقائياً"
      : "Drag the handle or use arrows to reorder — saves automatically";
  const savedLabel = locale === "ar" ? "تم الحفظ" : "Saved";
  const deleteBlockedTip =
    locale === "ar"
      ? "لا يمكن حذف فئة تحتوي على منتجات"
      : "Cannot delete a category that contains products";

  return (
    <div id="category-create" className="scroll-mt-20">
    <Card
      padded={false}
      aria-label={dict.admin.categories}
      className="overflow-hidden"
    >
      <CardHeader
        className="!pb-3.5"
        title={dict.admin.categories}
        count={ordered.length}
        actions={
          <button
            type="button"
            className="rad-btn rad-pri rad-sm whitespace-nowrap"
            onClick={() => openDialog({ mode: "create" })}
          >
            {u.categoryCreate}
          </button>
        }
      >
        <p className="rad-hint2 !mt-0 w-full">
          {reorderHint}
          {savedFlash ? (
            <span className="ms-2 font-semibold" style={{ color: "var(--rad-ok)" }}>
              · {savedLabel}
            </span>
          ) : null}
        </p>
      </CardHeader>

      {ordered.length === 0 ? (
        <EmptyState
          title={u.emptyTitle}
          body={u.emptyBody}
          icon={<Tags width={26} height={26} strokeWidth={1.5} aria-hidden />}
          action={
            <button
              type="button"
              className="rad-btn rad-gh rad-sm"
              onClick={() => openDialog({ mode: "create" })}
            >
              {u.categoryCreate}
            </button>
          }
        />
      ) : (
        <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5">
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
                  setDragId(null);
                  persistOrder(next);
                }}
                className={cn(
                  "rad-card p-4",
                  dragId === r.id && "opacity-60",
                  reordering && "pointer-events-none"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <span
                      className="inline-flex size-9 cursor-grab items-center justify-center rounded-[10px] active:cursor-grabbing"
                      style={{
                        color: "var(--rad-tx3)",
                        background: "var(--rad-surface3)",
                      }}
                      aria-hidden
                      title={locale === "ar" ? "اسحب لإعادة الترتيب" : "Drag to reorder"}
                    >
                      <GripVertical width={16} height={16} strokeWidth={1.5} />
                    </span>
                    <button
                      type="button"
                      className="rad-btn rad-gh rad-sm !min-w-0 !px-2"
                      disabled={index === 0 || reordering}
                      aria-label={locale === "ar" ? "نقل لأعلى" : "Move up"}
                      onClick={() => moveRow(r.id, -1)}
                    >
                      <ArrowUp width={14} height={14} strokeWidth={1.5} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="rad-btn rad-gh rad-sm !min-w-0 !px-2"
                      disabled={index === ordered.length - 1 || reordering}
                      aria-label={locale === "ar" ? "نقل لأسفل" : "Move down"}
                      onClick={() => moveRow(r.id, 1)}
                    >
                      <ArrowDown width={14} height={14} strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-[color:var(--rad-tx)]">
                        {display(r)}
                      </p>
                      {r.isLaunch ? (
                        <Pill tone="ok">
                          {locale === "ar" ? "نشطة" : "Active"}
                        </Pill>
                      ) : null}
                    </div>
                    <p
                      className="text-xs rad-mono"
                      style={{ color: "var(--rad-tx3)" }}
                      dir="ltr"
                    >
                      {r.slug}
                    </p>
                    <p className="text-xs font-medium text-[color:var(--rad-tx2)]">
                      {u.categoryProducts}:{" "}
                      <span className="rad-num tabular-nums">{r.productCount}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rad-btn rad-gh rad-sm"
                        onClick={() => openDialog({ mode: "edit", row: r })}
                      >
                        {dict.admin.edit}
                      </button>
                      <button
                        type="button"
                        className="rad-btn rad-gh rad-sm"
                        disabled={r.isLaunch || r.productCount > 0}
                        title={
                          r.isLaunch
                            ? u.categoryDeleteLaunch
                            : r.productCount > 0
                              ? deleteBlockedTip
                              : undefined
                        }
                        onClick={() => {
                          setDeleteError(null);
                          setToDelete(r);
                        }}
                      >
                        {u.categoryDelete}
                      </button>
                    </div>
                  </div>
                  <span
                    className="rad-pt-empty shrink-0"
                    style={{ width: 40, height: 40 }}
                    aria-hidden
                  >
                    <Tags width={18} height={18} strokeWidth={1.5} />
                  </span>
                </div>
              </li>
            ))}
        </ul>
      )}

      <Modal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? u.categoryEdit : u.categoryCreate}
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
      </Modal>

      <Modal
        open={toDelete !== null}
        onClose={() => {
          if (!deleting) setToDelete(null);
        }}
        title={u.categoryDelete}
        actions={
          <>
            <button
              type="button"
              className="rad-btn rad-gh"
              disabled={deleting}
              onClick={() => setToDelete(null)}
            >
              {dict.common.cancel}
            </button>
            <button
              type="button"
              className="rad-btn rad-pri"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? "…" : u.categoryDelete}
            </button>
          </>
        }
      >
        <p className="rad-dim">
          {deleteError
            ? deleteError
            : `${u.categoryDeleteConfirm}${toDelete ? ` — ${display(toDelete)}` : ""}`}
        </p>
      </Modal>
    </Card>
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
        <Field label={u.categorySlug}>
          <Input
            name="slug"
            dir="ltr"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
        </Field>
      ) : (
        <p
          className="text-xs text-[color:var(--ro-text-muted)]"
          dir="ltr"
        >
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
        <p role="alert" className="rad-ferr">
          {errorMessage(state.error)}
        </p>
      ) : null}
      <div className="rad-acts !mt-2 !px-0 !pb-0">
        <button type="button" className="rad-btn rad-gh" onClick={onDone}>
          {dict.common.cancel}
        </button>
        <button type="submit" className="rad-btn rad-pri" disabled={pending}>
          {pending ? "…" : u.categorySave}
        </button>
      </div>
    </form>
  );
}
