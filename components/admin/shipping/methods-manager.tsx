"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  shippingDeleteMethodAction,
  shippingSaveMethodAction,
} from "@/app/shipping-admin-actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Field, Select } from "@/components/ui-kit/field";
import { Modal } from "@/components/ui-kit";
import { METHOD_MODES, METHOD_SECURITY, METHOD_SPEEDS } from "@/lib/shipping/admin-validate";
import { formErrorClass } from "@/lib/ui/form-classes";

export type MethodRow = {
  id: string;
  code: string;
  labelAr: string;
  labelEn: string;
  mode: string;
  speed: string | null;
  security: string | null;
  consolidation: boolean;
  consolidationNote: string;
  carrierLabel: string;
  trackingUrlTemplate: string | null;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  description: string;
  allowedClasses: string[];
  active: boolean;
  sortOrder: number;
  rateCount: number;
};

export function MethodsManager({
  rows,
  locale,
}: {
  rows: MethodRow[];
  locale: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [edit, setEdit] = useState<MethodRow | { create: true } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const draft = edit && "create" in edit ? null : edit;

  function submit(fd: FormData) {
    setError(null);
    start(async () => {
      const res = await shippingSaveMethodAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEdit(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm(ar ? "تعطيل/حذف هذه الطريقة؟" : "Disable/delete this method?")) return;
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const res = await shippingDeleteMethodAction(fd);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setEdit({ create: true })}>
          {ar ? "إضافة طريقة" : "Add method"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-[color:var(--rad-bd)]">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-[color:var(--rad-c1)] text-start">
            <tr>
              <th className="px-3 py-2 font-medium">{ar ? "الرمز" : "Code"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "الاسم" : "Name"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "النمط" : "Mode"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "أسعار" : "Rates"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "نشطة" : "Active"}</th>
              <th className="px-3 py-2 font-medium">{ar ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[color:var(--rad-bd)]">
                <td className="px-3 py-2">
                  <bdi dir="ltr" className="rad-mono">
                    {r.code}
                  </bdi>
                </td>
                <td className="px-3 py-2">{ar ? r.labelAr : r.labelEn || r.labelAr}</td>
                <td className="px-3 py-2">{r.mode}</td>
                <td className="px-3 py-2">
                  <bdi dir="ltr">{r.rateCount}</bdi>
                </td>
                <td className="px-3 py-2">{r.active ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="quiet" onClick={() => setEdit(r)}>
                      {ar ? "تعديل" : "Edit"}
                    </Button>
                    <Button type="button" variant="quiet" onClick={() => remove(r.id)}>
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
          title={draft ? (ar ? "تعديل طريقة" : "Edit method") : ar ? "طريقة جديدة" : "New method"}
        >
          <form
            className="grid max-h-[70vh] gap-3 overflow-y-auto pe-1"
            onSubmit={(e) => {
              e.preventDefault();
              submit(new FormData(e.currentTarget));
            }}
          >
            {draft ? <input type="hidden" name="id" value={draft.id} /> : null}
            <TextField
              name="code"
              label={ar ? "الرمز" : "Code"}
              defaultValue={draft?.code ?? ""}
              required
              dense
              dir="ltr"
              disabled={Boolean(draft)}
            />
            <TextField name="labelAr" label={ar ? "الاسم العربي" : "Arabic label"} defaultValue={draft?.labelAr ?? ""} required dense />
            <TextField name="labelEn" label={ar ? "الاسم الإنجليزي" : "English label"} defaultValue={draft?.labelEn ?? ""} dense dir="ltr" />
            <Field label={ar ? "النمط" : "Mode"}>
              <Select name="mode" defaultValue={draft?.mode ?? "LAND"}>
                {METHOD_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={ar ? "السرعة" : "Speed"}>
              <Select name="speed" defaultValue={draft?.speed ?? ""}>
                <option value="">{ar ? "—" : "—"}</option>
                {METHOD_SPEEDS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={ar ? "الأمان" : "Security"}>
              <Select name="security" defaultValue={draft?.security ?? ""}>
                <option value="">—</option>
                {METHOD_SECURITY.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <TextField name="carrierLabel" label={ar ? "الناقل" : "Carrier"} defaultValue={draft?.carrierLabel ?? ""} dense />
            <TextField
              name="trackingUrlTemplate"
              label={ar ? "قالب رابط التتبع (https)" : "Tracking URL template (https)"}
              defaultValue={draft?.trackingUrlTemplate ?? ""}
              dense
              dir="ltr"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField name="etaMinDays" label={ar ? "أدنى أيام" : "ETA min days"} type="number" defaultValue={draft?.etaMinDays ?? ""} dense dir="ltr" />
              <TextField name="etaMaxDays" label={ar ? "أقصى أيام" : "ETA max days"} type="number" defaultValue={draft?.etaMaxDays ?? ""} dense dir="ltr" />
            </div>
            <TextField name="description" label={ar ? "الوصف" : "Description"} defaultValue={draft?.description ?? ""} dense />
            <TextField
              name="allowedClasses"
              label={ar ? "الفئات المسموحة (مفصولة بفاصلة)" : "Allowed classes (comma-separated)"}
              defaultValue={(draft?.allowedClasses ?? []).join(",")}
              dense
              dir="ltr"
            />
            <TextField name="sortOrder" label={ar ? "الترتيب" : "Sort"} type="number" defaultValue={draft?.sortOrder ?? 0} dense dir="ltr" />
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="consolidation" defaultChecked={draft?.consolidation ?? false} className="size-4" />
              {ar ? "تجميع شحنات" : "Consolidation"}
            </label>
            <TextField
              name="consolidationNote"
              label={ar ? "ملاحظة التجميع" : "Consolidation note"}
              defaultValue={draft?.consolidationNote ?? ""}
              dense
            />
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={draft?.active ?? true} className="size-4" />
              {ar ? "نشطة" : "Active"}
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
