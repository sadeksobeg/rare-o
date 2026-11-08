"use client";

import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

export function RadWhatsAppCard({
  title,
  connected,
  statusLabel,
  description,
  openLabel,
  openHref,
}: {
  title: string;
  connected: boolean;
  statusLabel: string;
  description: string;
  openLabel: string;
  openHref: string;
}) {
  return (
    <section className="rad-card rad-wa rad-rise" style={{ "--rad-s": 7 } as React.CSSProperties}>
      <div className="rad-ch" style={{ padding: 0 }}>
        <h2>{title}</h2>
      </div>
      <div className="rad-st">
        <span className={cn("rad-dotp", connected && "rad-ok")} aria-hidden />
        <b>{statusLabel}</b>
      </div>
      <p>{description}</p>
      <Link href={openHref} className="rad-btn rad-gh rad-sm">
        <MessageSquareText width={16} height={16} strokeWidth={1.5} aria-hidden />
        {openLabel}
      </Link>
    </section>
  );
}
