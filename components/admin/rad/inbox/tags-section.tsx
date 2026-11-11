"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { adminAddInboxTagAction, adminRemoveInboxTagAction } from "@/app/whatsapp-actions";

const SYSTEM_TAG_LABELS: Record<string, keyof Dictionary["inbox"]> = {
  "phone-conflict": "phoneConflictChip",
};

export function RadTagsSection({
  conversationId,
  tags,
  ib,
  inbox,
}: {
  conversationId: string;
  tags: string[];
  ib: Dictionary["ib"];
  inbox: Dictionary["inbox"];
}) {
  function tagLabel(slug: string): string {
    const key = SYSTEM_TAG_LABELS[slug];
    if (!key) return slug;
    const label = inbox[key];
    return typeof label === "string" ? label : slug;
  }
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  function addTag() {
    const tag = draft.trim();
    if (!tag || pending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("conversationId", conversationId);
      fd.set("tag", tag);
      const result = await adminAddInboxTagAction(fd);
      if (!result.ok) {
        toast.error(ib.tagsHeading);
        return;
      }
      setDraft("");
      setAdding(false);
      router.refresh();
    });
  }

  function removeTag(tag: string) {
    if (pending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("conversationId", conversationId);
      fd.set("tag", tag);
      await adminRemoveInboxTagAction(fd);
      router.refresh();
    });
  }

  return (
    <div className="rad-tg">
      {tags.length === 0 && !adding ? <span style={{ color: "var(--rad-tx3)" }}>{ib.noTags}</span> : null}
      {tags.map((t) => {
        const label = tagLabel(t);
        return (
          <span key={t}>
            {label}
            <button
              type="button"
              onClick={() => removeTag(t)}
              aria-label={label}
              style={{ marginInlineStart: 6, display: "inline-flex" }}
              disabled={pending}
            >
              <X width={11} height={11} strokeWidth={2} aria-hidden />
            </button>
          </span>
        );
      })}
      {adding ? (
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
            if (e.key === "Escape") setAdding(false);
          }}
          onBlur={() => {
            if (draft.trim()) addTag();
            else setAdding(false);
          }}
          placeholder={ib.addTagPlaceholder}
          style={{
            height: 24,
            borderRadius: 99,
            border: "1px solid var(--rad-bd2)",
            background: "var(--rad-surface2)",
            color: "var(--rad-tx)",
            padding: "0 10px",
            font: "inherit",
            fontSize: 12,
            width: 110,
          }}
        />
      ) : (
        <button type="button" className="rad-addtag" onClick={() => setAdding(true)}>
          {ib.addTagLabel}
        </button>
      )}
    </div>
  );
}
