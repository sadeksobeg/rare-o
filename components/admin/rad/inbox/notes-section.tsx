"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { InboxNoteItem } from "@/lib/whatsapp/messaging/inbox";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import { adminAddInboxNoteAction } from "@/app/whatsapp-actions";

export function RadNotesSection({
  conversationId,
  notes,
  ib,
  locale,
}: {
  conversationId: string;
  notes: InboxNoteItem[];
  ib: Dictionary["ib"];
  locale: Locale;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const body = draft.trim();
    if (!body || pending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("conversationId", conversationId);
      fd.set("body", body);
      const result = await adminAddInboxNoteAction(fd);
      if (!result.ok) {
        toast.error(ib.notesHeading);
        return;
      }
      setDraft("");
      router.refresh();
    });
  }

  return (
    <>
      {notes.length === 0 ? (
        <p style={{ color: "var(--rad-tx3)", fontSize: 13 }}>{ib.notesEmpty}</p>
      ) : (
        notes.map((n) => (
          <div className="rad-nt" key={n.id}>
            {n.body}
            <small>
              {n.authorName} · {formatDate(n.createdAt, locale, { dateStyle: "medium", timeStyle: "short" })}
            </small>
          </div>
        ))
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={ib.addNotePlaceholder}
          disabled={pending}
          className="rad-fld-input"
          style={{
            flex: 1,
            height: 34,
            borderRadius: 9,
            border: "1px solid var(--rad-bd2)",
            background: "var(--rad-surface2)",
            color: "var(--rad-tx)",
            padding: "0 10px",
            font: "inherit",
            fontSize: 13,
          }}
        />
        <button
          type="button"
          className="rad-btn rad-gh rad-sm"
          disabled={!draft.trim() || pending}
          onClick={submit}
        >
          {ib.addNoteButton}
        </button>
      </div>
    </>
  );
}
