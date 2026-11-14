"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminCreateRetailRequestFromConversationAction,
  adminListRetailProductsAction,
  type RetailProductOption,
} from "@/app/whatsapp-actions";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import type { Locale } from "@/lib/i18n/config";
import { formatNumber } from "@/lib/i18n/format";

type Line = { productId: string; quantity: number };

const T = (locale: Locale, ar: string, en: string) => (locale === "ar" ? ar : en);

const ERR: Record<string, [string, string]> = {
  NAME_REQUIRED: ["أدخل اسم العميل", "Enter the customer name"],
  PHONE_REQUIRED: ["رقم الهاتف غير متوفر — أدخله يدوياً", "Phone not available — enter it"],
  LINES_REQUIRED: ["اختر قطعة واحدة على الأقل", "Pick at least one piece"],
  MIXED_CURRENCY_CART: ["القطع بعملات مختلفة — اختر قطعاً بعملة واحدة", "Mixed currencies — pick one currency"],
  CART_ITEMS_UNAVAILABLE: ["إحدى القطع لم تعد متاحة", "A piece is no longer available"],
  ALREADY_LINKED: ["المحادثة مرتبطة بسجل بالفعل", "Conversation is already linked"],
  TRADER_CONVERSATION: ["هذه محادثة تاجر", "This is a trader conversation"],
  CREATED_BUT_LINK_FAILED: ["أُنشئ الطلب لكن تعذّر ربطه — اربطه يدوياً", "Request created but linking failed — link it manually"],
};

/**
 * «إنشاء طلب تجزئة» — for a customer who wrote on WhatsApp first. Creates the
 * request (starting at «قيد المتابعة»), links this conversation and attaches
 * the customer record. Prices are the catalog's, shipping stays unconfirmed.
 */
export function CreateRetailRequestDialog({
  open,
  onClose,
  conversationId,
  defaultName,
  maskedPhone,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  defaultName: string;
  maskedPhone: string | null;
  locale: Locale;
}) {
  const router = useRouter();
  const [products, setProducts] = useState<RetailProductOption[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [key] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!open || products) return;
    let cancelled = false;
    (async () => {
      const res = await adminListRetailProductsAction();
      if (cancelled) return;
      if (res.ok && res.data) setProducts(res.data);
      else setLoadError(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, products]);

  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);

  const byId = useMemo(() => new Map((products ?? []).map((p) => [p.id, p])), [products]);
  const subtotal = useMemo(() => {
    const totals = new Map<string, number>();
    for (const l of lines) {
      const p = byId.get(l.productId);
      if (p) totals.set(p.currency, (totals.get(p.currency) ?? 0) + p.price * l.quantity);
    }
    return [...totals.entries()];
  }, [lines, byId]);
  const mixed = subtotal.length > 1;

  function submit() {
    setError(null);
    const valid = lines.filter((l) => l.productId);
    const fd = new FormData();
    fd.set("conversationId", conversationId);
    fd.set("customerName", name);
    if (phone.trim()) fd.set("customerPhone", phone.trim());
    fd.set("destinationCountry", destination);
    fd.set("customerNotes", notes);
    fd.set("lines", JSON.stringify(valid));
    fd.set("idempotencyKey", key);
    start(async () => {
      const res = await adminCreateRetailRequestFromConversationAction(fd);
      if (!res.ok) {
        const m = ERR[res.error];
        setError(m ? T(locale, m[0], m[1]) : T(locale, "تعذّر إنشاء الطلب", "Could not create the request"));
        return;
      }
      toast.success(
        T(locale, `أُنشئ الطلب ${res.data?.reference ?? ""} وربط بالمحادثة`, `Request ${res.data?.reference ?? ""} created and linked`)
      );
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={T(locale, "إنشاء طلب تجزئة من المحادثة", "Create a retail request from this chat")}
      description={T(
        locale,
        "يُنشأ الطلب بحالة «قيد المتابعة» ويُربط بهذه المحادثة وبسجل العميل. الأسعار من الكتالوج والشحن يُؤكَّد لاحقاً.",
        "The request starts as “In follow-up”, linked to this chat and the customer record. Catalog prices; shipping is confirmed later."
      )}
      size="md"
    >
      <div className="space-y-4">
        <TextField
          name="customerName"
          label={T(locale, "اسم العميل", "Customer name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          dense
          maxLength={120}
        />
        <div className="space-y-1.5">
          <TextField
            name="customerPhone"
            label={T(locale, "الهاتف (اختياري)", "Phone (optional)")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dense
            dir="ltr"
            placeholder={maskedPhone ?? "+963…"}
            maxLength={40}
          />
          <p className="text-xs text-[color:var(--rad-tx-2)]">
            {T(
              locale,
              "اتركه فارغاً لاستخدام رقم المحادثة نفسه.",
              "Leave empty to use this chat's own number."
            )}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{T(locale, "القطع", "Pieces")}</legend>
          {loadError ? (
            <p role="alert" className="text-sm">
              {T(locale, "تعذّر تحميل المنتجات", "Could not load products")}
            </p>
          ) : null}
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                aria-label={T(locale, "القطعة", "Piece")}
                value={l.productId}
                disabled={!products}
                onChange={(e) =>
                  setLines((prev) => prev.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))
                }
                className="h-11 min-w-0 flex-1 rounded-md border border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] px-3 text-sm"
              >
                <option value="">{products ? "—" : T(locale, "جارٍ التحميل…", "Loading…")}</option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {T(locale, p.nameAr, p.nameEn || p.nameAr)} — {formatNumber(p.price, locale)} {p.currency}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={99}
                value={l.quantity}
                aria-label={T(locale, "الكمية", "Quantity")}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((x, j) =>
                      j === i ? { ...x, quantity: Math.max(1, Math.min(99, Number(e.target.value) || 1)) } : x
                    )
                  )
                }
                className="h-11 w-16 rounded-md border border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] px-2 text-center text-sm tabular-nums"
              />
              {lines.length > 1 ? (
                <button
                  type="button"
                  aria-label={T(locale, "حذف السطر", "Remove line")}
                  onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))}
                  className="size-11 rounded-md border border-[color:var(--rad-bd)] text-lg"
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
          {lines.length < 6 ? (
            <button
              type="button"
              className="rad-btn rad-gh rad-sm"
              onClick={() => setLines((prev) => [...prev, { productId: "", quantity: 1 }])}
            >
              + {T(locale, "إضافة قطعة", "Add a piece")}
            </button>
          ) : null}
          {subtotal.length > 0 ? (
            <p className="text-sm font-semibold" dir="ltr">
              {mixed
                ? T(locale, "عملات مختلفة", "Mixed currencies")
                : `${formatNumber(subtotal[0]![1], locale)} ${subtotal[0]![0]}`}
            </p>
          ) : null}
        </fieldset>

        <TextField
          name="destinationCountry"
          label={T(locale, "الوجهة (اختياري)", "Destination (optional)")}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          dense
          maxLength={80}
        />
        <TextField
          name="customerNotes"
          label={T(locale, "ملاحظات", "Notes")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          dense
          maxLength={2000}
        />

        {error ? (
          <p role="alert" className="text-sm text-[color:var(--rad-err,#e5484d)]">
            {error}
          </p>
        ) : null}

        <div className="rad-link-dialog-actions">
          <button type="button" className="rad-btn rad-gh rad-sm" onClick={onClose}>
            {T(locale, "إلغاء", "Cancel")}
          </button>
          <button
            type="button"
            className="rad-btn rad-pri rad-sm"
            disabled={pending || mixed || lines.every((l) => !l.productId)}
            onClick={submit}
          >
            {T(locale, "إنشاء وربط", "Create & link")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
