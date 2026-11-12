"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { shippingUpdateInquiryAction } from "@/app/shipping-admin-actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Field, Select } from "@/components/ui-kit/field";
import { formErrorClass } from "@/lib/ui/form-classes";

export type InquiryRow = {
  id: string;
  destination: string;
  countryCode: string | null;
  status: string;
  notes: string;
  assignee: string | null;
  createdAt: string;
  contactName: string;
  contactPhone: string;
};

export function InquiriesManager({
  rows,
  locale,
}: {
  rows: InquiryRow[];
  locale: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!rows.length) {
    return (
      <p className="text-sm text-[color:var(--rad-tx-2)]">
        {ar ? "لا استفسارات شحن بعد." : "No shipping inquiries yet."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}
      {rows.map((row) => (
        <form
          key={row.id}
          className="grid gap-3 rounded-lg border border-[color:var(--rad-bd)] p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set("id", row.id);
            setError(null);
            start(async () => {
              const res = await shippingUpdateInquiryAction(fd);
              if (!res.ok) setError(res.error);
              else router.refresh();
            });
          }}
        >
          <div className="sm:col-span-2 text-sm">
            <bdi dir="ltr" className="rad-mono">
              {row.countryCode || row.destination}
            </bdi>
            {" · "}
            <bdi dir="ltr">{new Date(row.createdAt).toLocaleString()}</bdi>
            {row.contactName ? ` · ${row.contactName}` : ""}
            {row.contactPhone ? (
              <>
                {" · "}
                <bdi dir="ltr">{row.contactPhone}</bdi>
              </>
            ) : null}
          </div>
          <Field label={ar ? "الحالة" : "Status"}>
            <Select name="status" defaultValue={row.status}>
              {["NEW", "CONTACTED", "QUOTED", "CLOSED"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <TextField
            name="assignee"
            label={ar ? "المسؤول" : "Assignee"}
            defaultValue={row.assignee ?? ""}
            dense
          />
          <TextField
            name="notes"
            label={ar ? "ملاحظات" : "Notes"}
            defaultValue={row.notes}
            dense
            className="sm:col-span-2"
          />
          <div>
            <Button type="submit" loading={pending} size="sm">
              {ar ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      ))}
    </div>
  );
}
