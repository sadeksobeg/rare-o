"use client";

import { useEffect, useState, useTransition } from "react";
import {
  adminSearchLinkableRecordsAction,
  type LinkableRecordHit,
} from "@/app/whatsapp-actions";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { WhatsAppActiveLinkType } from "@/lib/whatsapp/messaging/link-constants";
import { cn } from "@/lib/utils";

/**
 * A17 — RecordPicker dialog: type tabs, search, single selection.
 */
export function RecordPicker({
  open,
  onClose,
  onConfirm,
  dict,
  initialType = "retail_request",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (hit: LinkableRecordHit) => void;
  dict: Dictionary;
  initialType?: WhatsAppActiveLinkType;
}) {
  const i = dict.inbox;
  const [linkType, setLinkType] =
    useState<WhatsAppActiveLinkType>(initialType);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<LinkableRecordHit[]>([]);
  const [selected, setSelected] = useState<LinkableRecordHit | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    const fd = new FormData();
    fd.set("linkType", linkType);
    fd.set("q", q);
    startTransition(async () => {
      const res = await adminSearchLinkableRecordsAction(fd);
      if (res.ok && res.data) setHits(res.data);
      else setHits([]);
    });
  }, [open, linkType, q]);

  const tabs: { id: WhatsAppActiveLinkType; label: string }[] = [
    { id: "retail_request", label: i.typeRetail },
    { id: "deal_proposal", label: i.typeDeal },
    { id: "wholesale_request", label: i.typeWholesale },
  ];

  return (
    <Dialog open={open} onClose={onClose} title={i.pickRecord} size="md">
      <div className="space-y-3 p-4">
        <div role="tablist" className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={linkType === t.id}
              onClick={() => setLinkType(t.id)}
              className={cn(
                "px-2.5 py-1.5 text-xs font-semibold",
                linkType === t.id
                  ? "bg-[var(--ro-plum-900)] text-[var(--ro-sand-100)]"
                  : "border border-ro-border text-ro-text-2"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={i.searchRecords}
          className="w-full border border-ro-border px-3 py-2 text-sm"
        />
        <ul className="max-h-64 divide-y divide-ro-border overflow-y-auto border border-ro-border">
          {pending && hits.length === 0 ? (
            <li className="p-3 text-sm text-ro-muted">{dict.common.loading}</li>
          ) : hits.length === 0 ? (
            <li className="p-3 text-sm text-ro-muted">{i.empty}</li>
          ) : (
            hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => setSelected(h)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-start text-sm hover:bg-ro-sunken",
                    selected?.id === h.id && "bg-[var(--ro-plum-50)]"
                  )}
                >
                  <span className="font-mono text-xs text-ro-muted">
                    {h.reference}
                  </span>
                  <span>
                    <bdi>{h.label}</bdi>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            {dict.common.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onConfirm(selected);
              onClose();
            }}
          >
            {i.confirmLink}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
