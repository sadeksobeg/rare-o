"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminTransitionRetailRequestAction } from "@/app/actions";
import { ConfirmDialog } from "@/components/ui/dialog";
import { StatusChip } from "@/components/ui/status-chip";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  RETAIL_REQUEST_TRANSITIONS,
  canTransitionRetailRequest,
  isRetailRequestStatus,
  type RetailRequestStatus,
} from "@/lib/retail-request/constants";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { cn } from "@/lib/utils";

export type RetailKanbanCard = {
  id: string;
  reference: string;
  customerName: string;
  status: string;
};

const BOARD_STATUSES: RetailRequestStatus[] = [
  "ready_for_handoff",
  "handoff_opened",
  "in_follow_up",
  "completed",
  "cancelled",
];

/** OPS-02 — Kanban with drop → confirm → server transition (valid edges only). */
export function RetailKanbanBoard({
  cards,
  dict,
}: {
  cards: RetailKanbanCard[];
  dict: Dictionary;
}) {
  const u = dict.adminUi;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<RetailRequestStatus | null>(
    null
  );
  const [confirm, setConfirm] = useState<{
    id: string;
    from: RetailRequestStatus;
    to: RetailRequestStatus;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onDrop(to: RetailRequestStatus) {
    if (!dragId) return;
    const card = cards.find((c) => c.id === dragId);
    setOverStatus(null);
    if (!card || !isRetailRequestStatus(card.status)) {
      setDragId(null);
      return;
    }
    const from = card.status;
    if (from === to) {
      setDragId(null);
      return;
    }
    if (!canTransitionRetailRequest(from, to)) {
      setError(u.kanbanConfirmBody);
      setDragId(null);
      return;
    }
    setConfirm({ id: card.id, from, to });
    setDragId(null);
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
          {error}
        </p>
      ) : null}
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        tabIndex={0}
        role="region"
        aria-label={u.viewKanban}
      >
        {BOARD_STATUSES.map((status) => {
          const items = cards.filter((c) => c.status === status);
          const allowedFrom = dragId
            ? cards.find((c) => c.id === dragId)?.status
            : null;
          const canDrop =
            allowedFrom &&
            isRetailRequestStatus(allowedFrom) &&
            (RETAIL_REQUEST_TRANSITIONS[allowedFrom] as readonly string[]).includes(
              status
            );
          return (
            <div
              key={status}
              onDragOver={(e) => {
                if (!canDrop) return;
                e.preventDefault();
                setOverStatus(status);
              }}
              onDragLeave={() => setOverStatus((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(status);
              }}
              className={cn(
                "w-[16.5rem] shrink-0 rounded-[14px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] p-3",
                overStatus === status && canDrop
                  ? "border-[color:var(--ro-plum-700)] ring-1 ring-[color:var(--ro-plum-700)]"
                  : null
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[color:var(--ro-text)]">
                  {u.status.retail[status] ?? status}
                </h2>
                <span className="tabular-nums text-xs text-[color:var(--ro-text-muted)]">
                  {items.length}
                </span>
              </div>
              <ul className="space-y-2">
                {items.map((card) => (
                  <li key={card.id}>
                    <div
                      draggable
                      onDragStart={() => {
                        setError(null);
                        setDragId(card.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStatus(null);
                      }}
                      className={cn(
                        "rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)] p-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-text)_4%,transparent)]",
                        dragId === card.id ? "opacity-60" : null,
                        "cursor-grab active:cursor-grabbing"
                      )}
                    >
                      <Link
                        href={`/admin/requests/${card.id}`}
                        className="block font-mono text-xs text-[color:var(--ro-text-muted)] underline-offset-2 hover:text-[color:var(--ro-accent-fg)] hover:underline"
                        dir="ltr"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {card.reference}
                      </Link>
                      <p className="mt-1 text-sm font-medium text-[color:var(--ro-text)]">
                        {card.customerName}
                      </p>
                      <div className="mt-2">
                        <StatusChip
                          size="sm"
                          {...getStatusChipProps(dict, "retail", card.status)}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={u.kanbanConfirmTitle}
        body={
          confirm
            ? `${u.status.retail[confirm.from] ?? confirm.from} → ${u.status.retail[confirm.to] ?? confirm.to}. ${u.kanbanConfirmBody}`
            : u.kanbanConfirmBody
        }
        confirmLabel={u.form.applyTransition}
        cancelLabel={dict.common.cancel}
        pending={pending}
        onConfirm={() => {
          if (!confirm) return;
          const fd = new FormData();
          fd.set("requestId", confirm.id);
          fd.set("toStatus", confirm.to);
          start(async () => {
            const res = await adminTransitionRetailRequestAction(fd);
            setConfirm(null);
            if (!res.ok) {
              setError(res.error ?? "Error");
              return;
            }
            router.refresh();
          });
        }}
      />
    </div>
  );
}
