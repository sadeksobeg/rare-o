"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ellipsis } from "lucide-react";
import {
  adminArchiveInboxConversationAction,
  adminBlockInboxConversationAction,
  adminMarkInboxUnreadAction,
  adminMuteInboxConversationAction,
  adminRevealInboxPhoneAction,
  adminUnlinkWhatsAppConversationAction,
} from "@/app/whatsapp-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxConversationDetail } from "@/lib/whatsapp/messaging/inbox";
import { FixedMenu } from "@/components/admin/rad/inbox/fixed-menu";

function linkedHref(link: InboxConversationDetail["link"]): string | null {
  if (!link.linked || !link.linkId) return null;
  switch (link.linkType) {
    case "retail_request":
      return `/admin/requests/${link.linkId}`;
    case "deal_proposal":
      return `/admin/deals/${link.linkId}`;
    case "wholesale_request":
      return `/admin/wholesale/${link.linkId}`;
    case "brokerage_request":
      return `/admin/brokerage/${link.linkId}`;
    default:
      return null;
  }
}

export function ThreadOverflowMenu({
  conversation,
  ib,
}: {
  conversation: InboxConversationDetail;
  ib: Dictionary["ib"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const masked = conversation.participantE164;
  const href = linkedHref(conversation.link);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (
        t instanceof Element &&
        t.closest(".rad-fixed-menu, .rad-ov-menu")
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function run(
    labelOk: string,
    action: () => Promise<{ ok: boolean; error?: string }>
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(ib.actionFailed);
        return;
      }
      toast.success(labelOk);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="rad-ov">
      <button
        ref={btnRef}
        type="button"
        className="rad-ib"
        data-tip={ib.moreActions}
        aria-label={ib.moreActions}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
      >
        <Ellipsis width={18} height={18} strokeWidth={1.5} aria-hidden />
      </button>
      <FixedMenu
        open={open}
        anchorRef={btnRef}
        placement="below-end"
        className="rad-menu rad-ov-menu"
      >
        <button
          type="button"
          role="menuitem"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("conversationId", conversation.id);
            run(ib.markedUnreadDone, () => adminMarkInboxUnreadAction(fd));
          }}
        >
          {ib.markUnread}
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("conversationId", conversation.id);
            fd.set("archived", conversation.archived ? "false" : "true");
            run(
              conversation.archived ? ib.unarchivedDone : ib.archivedDone,
              () => adminArchiveInboxConversationAction(fd)
            );
          }}
        >
          {conversation.archived ? ib.unarchiveConversation : ib.archiveConversation}
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("conversationId", conversation.id);
            fd.set("muted", conversation.muted ? "false" : "true");
            run(conversation.muted ? ib.unmutedDone : ib.mutedDone, () =>
              adminMuteInboxConversationAction(fd)
            );
          }}
        >
          {conversation.muted ? ib.unmute : ib.mute8h}
        </button>
        <hr />
        <button
          type="button"
          role="menuitem"
          disabled={!masked}
          onClick={async () => {
            if (!masked) return;
            try {
              await navigator.clipboard.writeText(masked);
              toast.success(ib.phoneCopied);
              setOpen(false);
            } catch {
              toast.error(ib.actionFailed);
            }
          }}
        >
          {ib.copyPhone}
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={pending || !conversation.hasPhone}
          onClick={() => {
            startTransition(async () => {
              const fd = new FormData();
              fd.set("conversationId", conversation.id);
              const result = await adminRevealInboxPhoneAction(fd);
              if (!result.ok || !result.data?.phone) {
                toast.error(ib.revealPhoneFailed);
                return;
              }
              try {
                await navigator.clipboard.writeText(result.data.phone);
                toast.success(ib.phoneRevealed);
              } catch {
                toast.success(`${ib.phoneRevealed}: ${result.data.phone}`);
              }
              setOpen(false);
            });
          }}
        >
          {ib.revealPhone}
        </button>
        <hr />
        <button
          type="button"
          role="menuitem"
          className={conversation.blocked ? undefined : "rad-dng"}
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("conversationId", conversation.id);
            fd.set("blocked", conversation.blocked ? "false" : "true");
            run(conversation.blocked ? ib.unblockedDone : ib.blockedDone, () =>
              adminBlockInboxConversationAction(fd)
            );
          }}
        >
          {conversation.blocked ? ib.unblockContact : ib.blockContact}
        </button>
        {href ? (
          <Link
            href={href}
            role="menuitem"
            className="rad-ov-link"
            onClick={() => setOpen(false)}
          >
            {ib.openLinkedRecord}
          </Link>
        ) : null}
        {conversation.link.linked ? (
          <button
            type="button"
            role="menuitem"
            className="rad-dng"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("conversationId", conversation.id);
              run(ib.unlinkDone, () => adminUnlinkWhatsAppConversationAction(fd));
            }}
          >
            {ib.unlinkRecord}
          </button>
        ) : null}
      </FixedMenu>
    </div>
  );
}
