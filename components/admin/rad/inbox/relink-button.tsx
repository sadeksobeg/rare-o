"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminLinkWhatsAppConversationAction } from "@/app/whatsapp-actions";

export function RelinkButton({
  conversationId,
  linkType,
  linkId,
}: {
  conversationId: string;
  linkType: string;
  linkId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="rad-btn rad-gh rad-sm shrink-0"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("conversationId", conversationId);
          fd.set("linkType", linkType);
          fd.set("linkId", linkId);
          const res = await adminLinkWhatsAppConversationAction(fd);
          if (!res.ok) return void toast.error("تعذّر الربط");
          toast.success("رُبطت المحادثة بهذا الطلب");
          router.refresh();
        })
      }
    >
      ربط
    </button>
  );
}
