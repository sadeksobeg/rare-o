"use client";

import { adminSendWhatsAppTextAction } from "@/app/whatsapp-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function InboxComposer({
  conversationId,
  outboundEnabled,
  dict,
}: {
  conversationId: string;
  outboundEnabled: boolean;
  dict: Dictionary;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const clientRequestIdRef = useRef<string | null>(null);
  const router = useRouter();

  function ensureClientRequestId(): string {
    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `out-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    return clientRequestIdRef.current;
  }

  if (!outboundEnabled) {
    return (
      <div className="border border-ro-line bg-ro-surface p-4 text-sm text-ro-purple">
        {dict.inbox.sendBlocked}
      </div>
    );
  }

  return (
    <form
      className="space-y-3 border border-ro-line p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("conversationId", conversationId);
        fd.set("text", text);
        fd.set("clientRequestId", ensureClientRequestId());
        startTransition(async () => {
          setError(null);
          setMessage(null);
          const res = await adminSendWhatsAppTextAction(fd);
          if (!res.ok) {
            if (res.error === "OUTBOUND_DISABLED") {
              setError(dict.inbox.sendBlocked);
            } else if (res.error === "UNAUTHORIZED") {
              setError("UNAUTHORIZED");
            } else {
              setError(res.error || dict.inbox.sendFailed);
            }
            return;
          }
          setMessage(dict.inbox.sendSuccess);
          setText("");
          clientRequestIdRef.current = null;
          router.refresh();
        });
      }}
    >
      <label className="block space-y-1 text-sm">
        <span className="text-ro-muted">{dict.inbox.replyPlaceholder}</span>
        <textarea
          name="text"
          rows={3}
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
          disabled={pending}
        />
      </label>
      {error ? <p className="text-sm text-ro-purple">{error}</p> : null}
      {message ? <p className="text-sm text-ro-muted">{message}</p> : null}
      <button
        type="submit"
        disabled={pending || !text.trim()}
        className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory disabled:opacity-60"
      >
        {pending ? dict.inbox.sending : dict.inbox.send}
      </button>
    </form>
  );
}
