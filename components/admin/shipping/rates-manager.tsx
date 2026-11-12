"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  shippingBulkAdjustRatesAction,
  shippingCopyRateAction,
  shippingDeleteRateAction,
  shippingSaveRateAction,
  shippingSetRatesActiveAction,
  shippingSetRatesVerifiedAction,
} from "@/app/shipping-admin-actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Field, Select } from "@/components/ui-kit/field";
import { Modal } from "@/components/ui-kit";
import {
  RATE_AUDIENCES,
  RATE_BASES,
  RATE_CURRENCIES,
  type RateInput,
} from "@/lib/shipping/admin-validate";
import { formErrorClass } from "@/lib/ui/form-classes";

export type RateListRow = {
  id: string;
  countryCode: string;
  countryNameAr: string;
  countryNameEn: string;
  region: string;
  methodId: string;
  methodCode: string;
  methodLabelAr: string;
  methodLabelEn: string;
  basis: string;
  amount: number;
  currency: string;
  audience: string;
  active: boolean;
  verified: boolean;
  maxWeightKg: number | null;
  note: string;
};

export function RatesManager({
  rows,
  methods,
  locale,
}: {
  rows: RateListRow[];
  methods: { id: string; code: string; labelAr: string; labelEn: string }[];
  locale: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [q, setQ] = useState("");
  const [verified, setVerified] = useState<"all" | "yes" | "no">("all");
  const [active, setActive] = useState<"all" | "yes" | "no">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<RateListRow | { create: true } | null>(null);
  const [copyFor, setCopyFor] = useState<RateListRow | null>(null);
  const [adjust, setAdjust] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (verified === "yes" && !r.verified) return false;
      if (verified === "no" && r.verified) return false;
      if (active === "yes" && !r.active) return false;
      if (active === "no" && r.active) return false;
      if (!q.trim()) return true;
      const hay = `${r.countryCode} ${r.countryNameAr} ${r.countryNameEn} ${r.methodCode} ${r.methodLabelAr} ${r.region}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [rows, q, verified, active]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulk(action: "verify" | "unverify" | "activate" | "deactivate") {
    const ids = [...selected];
    if (!ids.length) return;
    start(async () => {
      const fd = new FormData();
      for (const id of ids) fd.append("ids", id);
      let res;
      if (action === "verify" || action === "unverify") {
        fd.set("verified", action === "verify" ? "true" : "false");
        res = await shippingSetRatesVerifiedAction(fd);
      } else {
        fd.set("active", action === "activate" ? "true" : "false");
        res = await shippingSetRatesActiveAction(fd);
      }
      if (!res.ok) setError(res.error);
      else {
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  function saveRate(fd: FormData) {
    setError(null);
    start(async () => {
      const draft = edit && "create" in edit ? null : edit;
      const payload: RateInput & { id?: string } = {
        id: draft?.id,
        countryCode: String(fd.get("countryCode") || ""),
        methodId: String(fd.get("methodId") || ""),
        basis: String(fd.get("basis") || "PER_PARCEL") as RateInput["basis"],
        amount: Number(fd.get("amount") || 0),
        currency: String(fd.get("currency") || "USD"),
        tiers: null,
        firstKgAmount: num(fd.get("firstKgAmount")),
        additionalKgAmount: num(fd.get("additionalKgAmount")),
        minCharge: num(fd.get("minCharge")),
        maxWeightKg: num(fd.get("maxWeightKg")),
        minChargeableWeightKg: num(fd.get("minChargeableWeightKg")),
        handlingFee: num(fd.get("handlingFee")),
        freeShippingOver: num(fd.get("freeShippingOver")),
        audience: String(fd.get("audience") || "BOTH") as RateInput["audience"],
        validFrom: null,
        validTo: null,
        active: fd.get("active") === "on",
        verified: fd.get("verified") === "on",
        packageLabel: null,
        note: String(fd.get("note") || ""),
      };
      const body = new FormData();
      body.set("payload", JSON.stringify(payload));
      const res = await shippingSaveRateAction(body);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEdit(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm(ar ? "تعطيل هذا السعر؟" : "Deactivate this rate?")) return;
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const res = await shippingDeleteRateAction(fd);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  const draft = edit && "create" in edit ? null : edit;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <TextField name="shipping-rate-q" label={ar ? "بحث" : "Search"} value={q} onChange={(e) => setQ(e.target.value)} dense />
        <Field label={ar ? "معتمد" : "Verified"}>
          <Select value={verified} onChange={(e) => setVerified(e.target.value as typeof verified)}>
            <option value="all">{ar ? "الكل" : "All"}</option>
            <option value="yes">{ar ? "نعم" : "Yes"}</option>
            <option value="no">{ar ? "لا" : "No"}</option>
          </Select>
        </Field>
        <Field label={ar ? "نشط" : "Active"}>
          <Select value={active} onChange={(e) => setActive(e.target.value as typeof active)}>
            <option value="all">{ar ? "الكل" : "All"}</option>
            <option value="yes">{ar ? "نعم" : "Yes"}</option>
            <option value="no">{ar ? "لا" : "No"}</option>
          </Select>
        </Field>
        <Button type="button" onClick={() => setEdit({ create: true })}>
          {ar ? "سعر جديد" : "New rate"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={!selected.size || pending} onClick={() => bulk("verify")}>
          {ar ? "اعتماد" : "Verify"}
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={!selected.size || pending} onClick={() => bulk("unverify")}>
          {ar ? "إلغاء الاعتماد" : "Unverify"}
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={!selected.size || pending} onClick={() => bulk("activate")}>
          {ar ? "تفعيل" : "Activate"}
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={!selected.size || pending} onClick={() => bulk("deactivate")}>
          {ar ? "تعطيل" : "Deactivate"}
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={!selected.size || pending} onClick={() => setAdjust(true)}>
          {ar ? "تعديل جماعي" : "Bulk adjust"}
        </Button>
      </div>

      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-[color:var(--rad-bd)]">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="bg-[color:var(--rad-c1)] text-start">
            <tr>
              <th className="px-2 py-2" />
              <th className="px-3 py-2 font-medium">{ar ? "الدولة" : "Country"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "الطريقة" : "Method"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "الأساس" : "Basis"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "المبلغ" : "Amount"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "حالة" : "Flags"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-[color:var(--rad-bd)]">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    aria-label={ar ? "تحديد" : "Select"}
                  />
                </td>
                <td className="px-3 py-2">
                  <bdi dir="ltr">{r.countryCode}</bdi>
                  <span className="ms-2 text-[color:var(--rad-tx-2)]">
                    {ar ? r.countryNameAr : r.countryNameEn || r.countryNameAr}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {ar ? r.methodLabelAr : r.methodLabelEn || r.methodLabelAr}
                  <div className="text-xs text-[color:var(--rad-tx-2)]">
                    <bdi dir="ltr">{r.methodCode}</bdi>
                  </div>
                </td>
                <td className="px-3 py-2">{r.basis}</td>
                <td className="px-3 py-2">
                  <bdi dir="ltr">
                    {r.amount} {r.currency}
                  </bdi>
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.verified ? (ar ? "معتمد" : "verified") : (ar ? "غير معتمد" : "unverified")}
                  {" · "}
                  {r.active ? (ar ? "نشط" : "active") : (ar ? "معطّل" : "off")}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="quiet" size="sm" onClick={() => setEdit(r)}>
                      {ar ? "تعديل" : "Edit"}
                    </Button>
                    <Button type="button" variant="quiet" size="sm" onClick={() => setCopyFor(r)}>
                      {ar ? "نسخ" : "Copy"}
                    </Button>
                    <Link
                      href={`/admin/shipping/rates/${r.id}`}
                      className="inline-flex min-h-9 items-center px-2 text-sm text-[color:var(--rad-ac)] hover:underline"
                    >
                      {ar ? "السجل" : "History"}
                    </Link>
                    <Button type="button" variant="quiet" size="sm" onClick={() => remove(r.id)}>
                      {ar ? "تعطيل" : "Off"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit ? (
        <Modal open onClose={() => setEdit(null)} title={draft ? (ar ? "تعديل سعر" : "Edit rate") : ar ? "سعر جديد" : "New rate"}>
          <form
            className="grid max-h-[70vh] gap-3 overflow-y-auto pe-1 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              saveRate(new FormData(e.currentTarget));
            }}
          >
            <TextField name="countryCode" label={ar ? "رمز الدولة" : "Country code"} defaultValue={draft?.countryCode ?? ""} required dense dir="ltr" />
            <Field label={ar ? "الطريقة" : "Method"}>
              <Select name="methodId" defaultValue={draft?.methodId ?? methods[0]?.id ?? ""} required>
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {ar ? m.labelAr : m.labelEn || m.labelAr}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={ar ? "الأساس" : "Basis"}>
              <Select name="basis" defaultValue={draft?.basis ?? "PER_PARCEL"}>
                {RATE_BASES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
            <TextField name="amount" label={ar ? "المبلغ" : "Amount"} type="number" step="0.01" defaultValue={draft?.amount ?? 0} required dense dir="ltr" />
            <Field label={ar ? "العملة" : "Currency"}>
              <Select name="currency" defaultValue={draft?.currency ?? "USD"}>
                {RATE_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={ar ? "الجمهور" : "Audience"}>
              <Select name="audience" defaultValue={draft?.audience ?? "BOTH"}>
                {RATE_AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </Field>
            <TextField name="firstKgAmount" label={ar ? "أول كيلو حجمي" : "First vol. kg"} type="number" step="0.01" defaultValue="" dense dir="ltr" />
            <TextField name="additionalKgAmount" label={ar ? "كل كيلو حجمي إضافي" : "Each extra vol. kg"} type="number" step="0.01" defaultValue="" dense dir="ltr" />
            <TextField name="minCharge" label={ar ? "حد أدنى" : "Min charge"} type="number" step="0.01" defaultValue="" dense dir="ltr" />
            <TextField name="maxWeightKg" label={ar ? "أقصى كيلو حجمي" : "Max vol. kg"} type="number" step="0.01" defaultValue={draft?.maxWeightKg ?? ""} dense dir="ltr" />
            <TextField name="handlingFee" label={ar ? "رسوم مناولة" : "Handling"} type="number" step="0.01" defaultValue="" dense dir="ltr" />
            <TextField name="freeShippingOver" label={ar ? "شحن مجاني فوق" : "Free over"} type="number" step="0.01" defaultValue="" dense dir="ltr" />
            <TextField name="note" label={ar ? "ملاحظة" : "Note"} defaultValue={draft?.note ?? ""} dense className="sm:col-span-2" />
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={draft?.active ?? true} className="size-4" />
              {ar ? "نشط" : "Active"}
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="verified" defaultChecked={draft?.verified ?? false} className="size-4" />
              {ar ? "معتمد (ظاهر للعملاء)" : "Verified (public)"}
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit" loading={pending}>
                {ar ? "حفظ" : "Save"}
              </Button>
              <Button type="button" variant="quiet" onClick={() => setEdit(null)}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {copyFor ? (
        <Modal open onClose={() => setCopyFor(null)} title={ar ? "نسخ إلى دول" : "Copy to countries"}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("rateId", copyFor.id);
              start(async () => {
                const res = await shippingCopyRateAction(fd);
                if (!res.ok) setError(res.error);
                else {
                  setCopyFor(null);
                  router.refresh();
                }
              });
            }}
          >
            <p className="text-sm text-[color:var(--rad-tx-2)]">
              {ar ? "انسخ السعر غير معتمد إلى رموز دول مفصولة بفاصلة." : "Copies as unverified to comma-separated country codes."}
            </p>
            <TextField name="countryCodes" label={ar ? "رموز الدول" : "Country codes"} dense dir="ltr" required />
            <div className="flex gap-2">
              <Button type="submit" loading={pending}>
                {ar ? "نسخ" : "Copy"}
              </Button>
              <Button type="button" variant="quiet" onClick={() => setCopyFor(null)}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {adjust ? (
        <Modal open onClose={() => setAdjust(false)} title={ar ? "تعديل جماعي للأسعار" : "Bulk adjust rates"}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              for (const id of selected) fd.append("ids", id);
              start(async () => {
                const res = await shippingBulkAdjustRatesAction(fd);
                if (!res.ok) setError(res.error);
                else {
                  setAdjust(false);
                  setSelected(new Set());
                  router.refresh();
                }
              });
            }}
          >
            <Field label={ar ? "النوع" : "Kind"}>
              <Select name="kind" defaultValue="percent">
                <option value="percent">{ar ? "نسبة %" : "Percent %"}</option>
                <option value="fixed">{ar ? "مبلغ ثابت" : "Fixed amount"}</option>
              </Select>
            </Field>
            <TextField name="value" label={ar ? "القيمة" : "Value"} type="number" step="0.01" required dense dir="ltr" />
            <div className="flex gap-2">
              <Button type="submit" loading={pending}>
                {ar ? "تطبيق" : "Apply"}
              </Button>
              <Button type="button" variant="quiet" onClick={() => setAdjust(false)}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function num(v: FormDataEntryValue | null): number | null {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
