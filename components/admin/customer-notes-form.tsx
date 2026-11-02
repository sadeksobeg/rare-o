"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/text-field";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";

export function CustomerNotesForm({
  customerId,
  notes,
  dict,
  saved = false,
  error = false,
}: {
  customerId: string;
  notes: string;
  dict: Dictionary;
  saved?: boolean;
  error?: boolean;
}) {
  const u = dict.adminUi;
  const [value, setValue] = useState(notes);
  const dirty = value !== notes;
  useUnsavedGuard(dirty);

  useEffect(() => {
    setValue(notes);
  }, [notes]);

  return (
    <form
      action="/api/admin/customer-notes"
      method="post"
      className="space-y-3"
    >
      <input type="hidden" name="customerId" value={customerId} />
      <Textarea
        name="notes"
        label={u.detail.customerNotes}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        helper={u.customerNotesHelper}
        error={error ? u.customerNotesInvalid : undefined}
        maxLength={2000}
        rows={4}
        dense
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm">
          {u.customerNotesSave}
        </Button>
        {saved ? (
          <p
            className="text-sm font-medium text-[var(--ro-success-700)]"
            role="status"
          >
            {u.customerNotesSaved}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
            {u.customerNotesFailed}
          </p>
        ) : null}
      </div>
    </form>
  );
}
