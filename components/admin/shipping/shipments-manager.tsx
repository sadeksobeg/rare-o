"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  shippingCreateShipmentAction,
  shippingTransitionShipmentAction,
} from "@/app/shipping-admin-actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Field, Select } from "@/components/ui-kit/field";
import { formErrorClass } from "@/lib/ui/form-classes";
import {
  SHIPMENT_STATUS_AR,
  SHIPMENT_STATUS_EN,
  type AdminShipmentRow,
} from "@/lib/shipping/shipments-shared";

export function ShipmentsManager({
  rows,
  requests,
  locale,
  filter,
}: {
  rows: AdminShipmentRow[];
  requests: { key: string; label: string }[];
  locale: string;
  filter: string;
}) {
  const ar = locale === "ar";
  const L = ar ? SHIPMENT_STATUS_AR : SHIPMENT_STATUS_EN;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const statuses = ["ALL", ...Object.keys(SHIPMENT_STATUS_AR)];

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}

      <nav
        className="flex flex-wrap gap-2"
        aria-label={ar ? "تصفية الحالة" : "Status filter"}
      >
        {statuses.map((s) => (
          <Link
            key={s}
            href={
              s === "ALL"
                ? "/admin/shipping/shipments"
                : `/admin/shipping/shipments?status=${s}`
            }
            aria-current={filter === s ? "page" : undefined}
            className={
              "inline-flex min-h-11 items-center rounded-full px-3 text-xs font-medium " +
              (filter === s
                ? "bg-[color:var(--rad-ac)] text-[color:var(--rad-ac-fg,white)]"
                : "bg-[color:var(--rad-c1)] text-[color:var(--rad-tx)]")
            }
          >
            {s === "ALL" ? (ar ? "الكل" : "All") : L[s]}
          </Link>
        ))}
      </nav>

      <details className="rounded-lg border border-[color:var(--rad-bd)] p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          {ar ? "إنشاء شحنة من طلب" : "Create shipment from a request"}
        </summary>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            setError(null);
            start(async () => {
              const res = await shippingCreateShipmentAction(fd);
              if (!res.ok) setError(res.error);
              else {
                form.reset();
                router.refresh();
              }
            });
          }}
        >
          <Field label={ar ? "الطلب" : "Request"}>
            <Select name="request" required defaultValue="">
              <option value="" disabled>
                {requests.length
                  ? "—"
                  : ar
                    ? "لا طلبات مؤهلة"
                    : "No eligible requests"}
              </option>
              {requests.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <TextField label={ar ? "طريقة الشحن" : "Method"} dense name="methodLabel" maxLength={160} />
          <TextField label={ar ? "الناقل" : "Carrier"} dense name="carrierLabel" maxLength={120} />
          <TextField label={ar ? "رقم التتبع" : "Tracking number"} dense name="trackingNumber" maxLength={64} dir="ltr" />
          <TextField label={ar ? "الدولة" : "Country"} dense name="destCountry" maxLength={80} />
          <TextField label={ar ? "المدينة" : "City"} dense name="destCity" maxLength={80} />
          <TextField label={ar ? "العنوان" : "Address"} dense name="destAddress" maxLength={300} />
          <TextField label={ar ? "المستلم" : "Recipient"} dense name="recipientName" maxLength={120} />
          <TextField label={ar ? "هاتف المستلم" : "Recipient phone"} dense name="recipientPhone" maxLength={40} dir="ltr" />
          <TextField label={ar ? "السعر المحتسب (USD)" : "Price charged (USD)"} dense name="priceCharged" inputMode="decimal" dir="ltr" defaultValue="0" />
          <div className="sm:col-span-2">
            <Button type="submit" loading={pending}>
              {ar ? "إنشاء" : "Create"}
            </Button>
          </div>
        </form>
      </details>

      {rows.length === 0 ? (
        <p className="text-sm text-[color:var(--rad-tx-2)]">
          {ar ? "لا شحنات." : "No shipments."}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-[color:var(--rad-bd)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">
                  <bdi dir="ltr">{r.parentLabel}</bdi> · {r.destCountry || "—"}
                  {r.destCity ? ` · ${r.destCity}` : ""}
                </span>
                <span className="rounded-full bg-[color:var(--rad-c1)] px-2.5 py-1 text-xs font-semibold">
                  {L[r.status] ?? r.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-[color:var(--rad-tx-2)]">
                {r.methodLabel}
                {r.carrierLabel ? ` · ${r.carrierLabel}` : ""}
                {r.trackingNumber ? (
                  <>
                    {" · "}
                    <bdi dir="ltr">{r.trackingNumber}</bdi>
                  </>
                ) : null}
                {" · "}
                <Link
                  href={`/track/${r.publicToken}`}
                  className="underline"
                  target="_blank"
                >
                  {ar ? "صفحة التتبع" : "Tracking page"}
                </Link>
              </p>
              {r.next.length ? (
                <form
                  className="mt-3 flex flex-wrap items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    fd.set("id", r.id);
                    setError(null);
                    start(async () => {
                      const res = await shippingTransitionShipmentAction(fd);
                      if (!res.ok) setError(res.error);
                      else router.refresh();
                    });
                  }}
                >
                  <Field label={ar ? "الحالة التالية" : "Next status"}>
                    <Select name="to" defaultValue={r.next[0]}>
                      {r.next.map((s) => (
                        <option key={s} value={s}>
                          {L[s]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <TextField label={ar ? "ملاحظة" : "Note"} dense name="note" maxLength={500} />
                  <TextField label={ar ? "رقم التتبع" : "Tracking"} dense name="trackingNumber" maxLength={64} dir="ltr" />
                  <Button type="submit" loading={pending}>
                    {ar ? "تحديث" : "Update"}
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
