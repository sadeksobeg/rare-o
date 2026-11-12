"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  shippingDeleteCountryAction,
  shippingSaveCountryAction,
} from "@/app/shipping-admin-actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Field, Select } from "@/components/ui-kit/field";
import { Modal } from "@/components/ui-kit";
import { formErrorClass } from "@/lib/ui/form-classes";

export type CountryRow = {
  code: string;
  nameAr: string;
  nameEn: string;
  region: string;
  active: boolean;
  inquiryEnabled: boolean;
  note: string;
  sortOrder: number;
  rateCount: number;
};

export function CountriesManager({
  rows,
  locale,
}: {
  rows: CountryRow[];
  locale: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [edit, setEdit] = useState<CountryRow | { create: true } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const filtered = rows.filter((r) => {
    if (filter === "active" && !r.active) return false;
    if (filter === "inactive" && r.active) return false;
    if (!q.trim()) return true;
    const hay = `${r.code} ${r.nameAr} ${r.nameEn} ${r.region}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  function submit(fd: FormData) {
    setError(null);
    start(async () => {
      const res = await shippingSaveCountryAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEdit(null);
      router.refresh();
    });
  }

  function remove(code: string) {
    if (!window.confirm(ar ? "تعطيل/حذف هذه الدولة؟" : "Disable/delete this country?")) {
      return;
    }
    start(async () => {
      const fd = new FormData();
      fd.set("code", code);
      const res = await shippingDeleteCountryAction(fd);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  const draft = edit && "create" in edit ? null : edit;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          name="shipping-country-q"
          label={ar ? "بحث" : "Search"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          dense
          className="min-w-[12rem] flex-1"
        />
        <Field label={ar ? "الحالة" : "Status"}>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">{ar ? "الكل" : "All"}</option>
            <option value="active">{ar ? "نشطة" : "Active"}</option>
            <option value="inactive">{ar ? "معطّلة" : "Inactive"}</option>
          </Select>
        </Field>
        <Button type="button" onClick={() => setEdit({ create: true })}>
          {ar ? "إضافة دولة" : "Add country"}
        </Button>
      </div>

      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-[color:var(--rad-bd)]">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-[color:var(--rad-c1)] text-start">
            <tr>
              <th className="px-3 py-2 font-medium">{ar ? "الرمز" : "Code"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "الاسم" : "Name"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "المنطقة" : "Region"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "أسعار" : "Rates"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "نشطة" : "Active"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.code} className="border-t border-[color:var(--rad-bd)]">
                <td className="px-3 py-2">
                  <bdi dir="ltr" className="rad-mono">
                    {r.code}
                  </bdi>
                </td>
                <td className="px-3 py-2">
                  {ar ? r.nameAr || r.nameEn : r.nameEn || r.nameAr}
                </td>
                <td className="px-3 py-2">{r.region}</td>
                <td className="px-3 py-2">
                  <bdi dir="ltr">{r.rateCount}</bdi>
                </td>
                <td className="px-3 py-2">{r.active ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="quiet" onClick={() => setEdit(r)}>
                      {ar ? "تعديل" : "Edit"}
                    </Button>
                    <Button type="button" variant="quiet" onClick={() => remove(r.code)}>
                      {ar ? "حذف" : "Delete"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit ? (
        <Modal
          open
          onClose={() => setEdit(null)}
          title={draft ? (ar ? "تعديل دولة" : "Edit country") : ar ? "دولة جديدة" : "New country"}
        >
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(new FormData(e.currentTarget));
            }}
          >
            {!draft ? (
              <TextField name="code" label={ar ? "رمز الدولة" : "Country code"} required dense dir="ltr" />
            ) : (
              <input type="hidden" name="code" value={draft.code} />
            )}
            <input type="hidden" name="create" value={draft ? "false" : "true"} />
            <TextField
              name="nameAr"
              label={ar ? "الاسم العربي" : "Arabic name"}
              defaultValue={draft?.nameAr ?? ""}
              required
              dense
            />
            <TextField
              name="nameEn"
              label={ar ? "الاسم الإنجليزي" : "English name"}
              defaultValue={draft?.nameEn ?? ""}
              dense
              dir="ltr"
            />
            <TextField
              name="region"
              label={ar ? "المنطقة" : "Region"}
              defaultValue={draft?.region ?? "other"}
              dense
            />
            <TextField
              name="note"
              label={ar ? "ملاحظة للعميل" : "Customer note"}
              defaultValue={draft?.note ?? ""}
              dense
            />
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={draft?.active ?? true} className="size-4" />
              {ar ? "نشطة" : "Active"}
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="inquiryEnabled"
                defaultChecked={draft?.inquiryEnabled ?? true}
                className="size-4"
              />
              {ar ? "السماح بـ «اطلب عرض سعر»" : "Allow “request a quote”"}
            </label>
            <div className="flex flex-wrap gap-2 pt-2">
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
    </div>
  );
}
