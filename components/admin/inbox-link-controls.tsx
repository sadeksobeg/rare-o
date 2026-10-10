"use client";

import {
  adminLinkWhatsAppConversationAction,
  adminUnlinkWhatsAppConversationAction,
} from "@/app/whatsapp-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxLinkSummary } from "@/lib/whatsapp/messaging/inbox";
import type { WhatsAppActiveLinkType } from "@/lib/whatsapp/messaging/link-constants";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function typeLabel(dict: Dictionary, linkType: string): string {
  switch (linkType) {
    case "retail_request":
      return dict.inbox.typeRetail;
    case "deal_proposal":
      return dict.inbox.typeDeal;
    case "wholesale_request":
      return dict.inbox.typeWholesale;
    default:
      return dict.inbox.notLinked;
  }
}

export function InboxLinkControls({
  conversationId,
  link,
  dict,
}: {
  conversationId: string;
  link: InboxLinkSummary;
  dict: Dictionary;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<WhatsAppActiveLinkType>(
    link.linked && link.linkType !== "none"
      ? link.linkType
      : "retail_request"
  );
  const [linkId, setLinkId] = useState(link.linkId ?? "");
  const router = useRouter();

  function mapError(code: string): string {
    if (code === "UNAUTHORIZED") return dict.inbox.linkErrorUnauthorized;
    if (code === "UNSUPPORTED_LINK_TYPE") return dict.inbox.linkErrorUnsupported;
    if (code === "TARGET_NOT_FOUND" || code === "CONVERSATION_NOT_FOUND") {
      return dict.inbox.linkErrorNotFound;
    }
    return code;
  }

  return (
    <div className="space-y-3 border border-ro-line p-4 text-sm">
      <h2 className="text-lg">
        {link.linked ? dict.inbox.linkChange : dict.inbox.linkSave}
      </h2>
      <p className="text-ro-muted">
        {link.linked
          ? `${dict.inbox.linkedAs}: ${typeLabel(dict, link.linkType)} · ${link.linkId}`
          : dict.inbox.notLinked}
      </p>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData();
          fd.set("conversationId", conversationId);
          fd.set("linkType", linkType);
          fd.set("linkId", linkId.trim());
          startTransition(async () => {
            setError(null);
            setMessage(null);
            const res = await adminLinkWhatsAppConversationAction(fd);
            if (!res.ok) {
              setError(mapError(res.error));
              return;
            }
            setMessage(dict.inbox.linkSuccess);
            router.refresh();
          });
        }}
      >
        <label className="space-y-1">
          <span className="block text-ro-muted">{dict.inbox.linkType}</span>
          <select
            value={linkType}
            onChange={(e) =>
              setLinkType(e.target.value as WhatsAppActiveLinkType)
            }
            className="border border-ro-line bg-transparent px-3 py-2"
            disabled={pending}
          >
            <option value="retail_request">{dict.inbox.typeRetail}</option>
            <option value="deal_proposal">{dict.inbox.typeDeal}</option>
            <option value="wholesale_request">{dict.inbox.typeWholesale}</option>
          </select>
        </label>
        <label className="min-w-[12rem] flex-1 space-y-1">
          <span className="block text-ro-muted">{dict.inbox.linkRecordId}</span>
          <input
            value={linkId}
            onChange={(e) => setLinkId(e.target.value)}
            required
            className="w-full border border-ro-line bg-transparent px-3 py-2 font-mono text-xs"
            disabled={pending}
          />
        </label>
        <button
          type="submit"
          disabled={pending || !linkId.trim()}
          className="bg-ro-purple px-4 py-2 text-ro-ivory disabled:opacity-60"
        >
          {link.linked ? dict.inbox.linkChange : dict.inbox.linkSave}
        </button>
      </form>

      {link.linked ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData();
            fd.set("conversationId", conversationId);
            startTransition(async () => {
              setError(null);
              setMessage(null);
              const res = await adminUnlinkWhatsAppConversationAction(fd);
              if (!res.ok) {
                setError(mapError(res.error));
                return;
              }
              setLinkId("");
              setMessage(dict.inbox.unlinkSuccess);
              router.refresh();
            });
          }}
        >
          <button
            type="submit"
            disabled={pending}
            className="border border-ro-line px-4 py-2 disabled:opacity-60"
          >
            {dict.inbox.linkClear}
          </button>
        </form>
      ) : null}

      {error ? <p className="text-ro-purple">{error}</p> : null}
      {message ? <p className="text-ro-muted">{message}</p> : null}
    </div>
  );
}
