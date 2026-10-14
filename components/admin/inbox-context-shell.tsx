"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { PanelRight } from "lucide-react";

/**
 * AD-03 context openers (not the ≥1280 inline column — that lives on the page):
 * - 1024–1279: drawer from thread header
 * - <1024: bottom Sheet
 */
export function InboxContextShell({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const i = dict.inbox;

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="shrink-0"
        aria-haspopup="dialog"
      >
        <PanelRight className="size-4" aria-hidden />
        <span className="ms-1.5">{i.openContext}</span>
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={i.businessContext}
        size="md"
      >
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
      </Dialog>
    </>
  );
}
