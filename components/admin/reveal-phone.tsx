"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatMaskedPhone } from "@/lib/whatsapp/messaging/phone-format";
import { cn } from "@/lib/utils";

/**
 * List policy: show masked. Detail: masked by default, full behind «إظهار».
 */
export function RevealPhone({
  phone,
  showLabel,
  hideLabel,
  className,
}: {
  phone: string;
  showLabel: string;
  hideLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const masked = formatMaskedPhone(phone) || phone;
  const display = open ? phone : masked;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <bdi dir="ltr" style={{ unicodeBidi: "isolate" }}>
        {display}
      </bdi>
      <button
        type="button"
        className="rad-btn rad-gh rad-sm inline-flex items-center gap-1.5"
        onClick={() => setOpen((v) => !v)}
        aria-pressed={open}
      >
        {open ? (
          <EyeOff width={14} height={14} strokeWidth={1.5} aria-hidden />
        ) : (
          <Eye width={14} height={14} strokeWidth={1.5} aria-hidden />
        )}
        {open ? hideLabel : showLabel}
      </button>
    </span>
  );
}
