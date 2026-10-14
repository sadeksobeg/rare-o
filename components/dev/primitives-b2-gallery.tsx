"use client";

import { useState } from "react";
import { Button, IconButton, ButtonLink } from "@/components/ui/button";
import { TextField, Textarea } from "@/components/ui/text-field";
import { StatusChip } from "@/components/ui/status-chip";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/banner";
import { Loader } from "@/components/ui/loader";
import { StatusStepper } from "@/components/ui/status-stepper";
import { Timeline } from "@/components/ui/timeline";
import { KeyValueList } from "@/components/ui/key-value-list";
import { Pagination } from "@/components/ui/pagination";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Divider } from "@/components/ui/divider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { MoreHorizontal } from "lucide-react";

export type PrimitivesB2Copy = {
  locale: "ar" | "en";
  dict: Dictionary;
  sectionLight: string;
  sectionInverse: string;
  btnPrimary: string;
  btnSecondary: string;
  btnText: string;
  btnDanger: string;
  btnQuiet: string;
  btnInverseP: string;
  btnInverseS: string;
  btnRipple: string;
  fieldLabel: string;
  fieldHelper: string;
  fieldError: string;
  fieldDense: string;
  fieldCounter: string;
  areaLabel: string;
  dialogOpen: string;
  dialogTitle: string;
  dialogBody: string;
  confirmOpen: string;
  confirmTitle: string;
  confirmBody: string;
  toastInfo: string;
  toastError: string;
  toastFireInfo: string;
  toastFireError: string;
  emptyTitle: string;
  emptyBody: string;
  emptyAction: string;
  bannerInfo: string;
  bannerDanger: string;
  timelineTitle: string;
  kvRef: string;
  kvStatus: string;
  kvCustomer: string;
  crumbHome: string;
  crumbRequests: string;
  crumbDetail: string;
  pageOf: string;
};

function formatPageOf(template: string, page: number, pages: number) {
  return template
    .replace("{page}", String(page))
    .replace("{pages}", String(pages));
}

function ToastDemo({ copy }: { copy: PrimitivesB2Copy }) {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => toast({ message: copy.toastInfo, tone: "info" })}
      >
        {copy.toastFireInfo}
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => toast({ message: copy.toastError, tone: "error" })}
      >
        {copy.toastFireError}
      </Button>
    </div>
  );
}

function Surface({
  inverse,
  title,
  copy,
}: {
  inverse: boolean;
  title: string;
  copy: PrimitivesB2Copy;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(2);
  const pageCount = 5;
  const c = copy.dict.common;

  return (
    <div
      className={
        inverse
          ? "ro-inverse space-y-10 rounded-[var(--ro-r-sm)] border border-ro-line-on-dark p-6"
          : "space-y-10 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper p-6"
      }
    >
      <h3 className="text-base font-semibold text-ro-ink">{title}</h3>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P01 Button
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">{copy.btnPrimary} sm</Button>
          <Button size="md">{copy.btnPrimary} md</Button>
          <Button size="lg">{copy.btnPrimary} lg</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary">{copy.btnSecondary}</Button>
          <Button variant="text">{copy.btnText}</Button>
          <Button variant="danger">{copy.btnDanger}</Button>
          <Button variant="quiet">{copy.btnQuiet}</Button>
          <IconButton label={copy.btnQuiet} variant="quiet">
            <MoreHorizontal className="size-5" strokeWidth={1.5} />
          </IconButton>
        </div>
        <div
          className={
            inverse
              ? "flex flex-wrap gap-2"
              : "ro-inverse flex flex-wrap gap-2 rounded-[var(--ro-r-sm)] p-4"
          }
        >
          <Button variant="inverse-primary">{copy.btnInverseP}</Button>
          <Button variant="inverse-secondary">{copy.btnInverseS}</Button>
        </div>
        <Button ripple variant="primary">
          {copy.btnRipple}
        </Button>
        <ButtonLink href="/dev/ui" variant="secondary" size="sm">
          ButtonLink
        </ButtonLink>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P02 TextField / Textarea
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label={copy.fieldLabel}
            name={`tf-${inverse ? "i" : "l"}`}
            helper={copy.fieldHelper}
            defaultValue=""
          />
          <TextField
            label={copy.fieldLabel}
            name={`tf-err-${inverse ? "i" : "l"}`}
            error={copy.fieldError}
          />
          <TextField
            label={copy.fieldDense}
            name={`tf-d-${inverse ? "i" : "l"}`}
            dense
          />
          <TextField
            label={copy.fieldCounter}
            name={`tf-c-${inverse ? "i" : "l"}`}
            maxLength={40}
            defaultValue=""
          />
          <Textarea
            label={copy.areaLabel}
            name={`ta-${inverse ? "i" : "l"}`}
            maxLength={120}
            className="md:col-span-2"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P06 StatusChip ← status.ts
        </p>
        <div className="flex flex-wrap gap-2">
          <StatusChip
            domain="retail"
            value="ready_for_handoff"
            dict={copy.dict}
          />
          <StatusChip domain="retail" value="in_follow_up" dict={copy.dict} />
          <StatusChip
            domain="deal"
            value="negotiating"
            dict={copy.dict}
            variant="dot"
            size="sm"
          />
          <StatusChip domain="wholesale" value="quote_provided" dict={copy.dict} />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P08 Dialog / Sheet
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            {copy.dialogOpen}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setConfirmOpen(true)}
          >
            {copy.confirmOpen}
          </Button>
        </div>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={copy.dialogTitle}
          size="md"
        >
          <p className="text-sm text-ro-muted">{copy.dialogBody}</p>
          <Button
            type="button"
            size="sm"
            className="mt-2"
            onClick={() => setDialogOpen(false)}
          >
            {c.close}
          </Button>
        </Dialog>
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          title={copy.confirmTitle}
          body={copy.confirmBody}
          confirmLabel={c.save}
          cancelLabel={c.cancel}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P11 Toast
        </p>
        <ToastDemo copy={copy} />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P12 Skeleton · P22 Loader
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="aspect-[4/5]" />
          <Skeleton className="h-10" />
          <Skeleton className="h-24" />
        </div>
        <div className="flex items-center gap-4">
          <Loader size={24} label={c.loading} />
          <Loader size={40} label={c.loading} />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P13 EmptyState · P21 Banner
        </p>
        <Banner tone="info">{copy.bannerInfo}</Banner>
        <Banner tone="danger">{copy.bannerDanger}</Banner>
        <EmptyState
          variant="no-results"
          title={copy.emptyTitle}
          body={copy.emptyBody}
          actionHref="/dev/ui"
          actionLabel={copy.emptyAction}
          className="border border-dashed border-ro-border py-10"
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P18 Stepper
        </p>
        <StatusStepper
          domain="retail"
          current="handoff_opened"
          dict={copy.dict}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P19 Timeline
        </p>
        <Timeline
          label={c.timelineLabel}
          events={[
            {
              id: "1",
              title: copy.timelineTitle,
              actor: copy.locale === "ar" ? "إدارة" : "Admin",
              relativeTime: copy.locale === "ar" ? "منذ ساعة" : "1h ago",
              absoluteTime: "2026-10-12 09:00",
              detail:
                copy.locale === "ar"
                  ? "تم فتح المحادثة."
                  : "Conversation opened.",
            },
            {
              id: "2",
              title:
                copy.locale === "ar" ? "رد العميل" : "Customer reply",
              actor: copy.locale === "ar" ? "عميل" : "Customer",
              relativeTime: copy.locale === "ar" ? "منذ 20 د" : "20m ago",
              absoluteTime: "2026-10-12 09:40",
            },
          ]}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P20 KeyValueList
        </p>
        <KeyValueList
          items={[
            { label: copy.kvRef, value: <bdi>RO-1042</bdi> },
            {
              label: copy.kvStatus,
              value: (
                <StatusChip
                  domain="retail"
                  value="ready_for_handoff"
                  dict={copy.dict}
                  size="sm"
                />
              ),
            },
            { label: copy.kvCustomer, value: "Sara N." },
          ]}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P15 Pagination · P16 Breadcrumb
        </p>
        <Breadcrumb
          label={copy.dict.product.breadcrumb}
          items={[
            { label: copy.crumbHome, href: "/dev/ui" },
            { label: copy.crumbRequests, href: "/dev/ui#p2-b2" },
            { label: copy.crumbDetail },
          ]}
        />
        <Pagination
          page={page}
          pageCount={pageCount}
          pageOfLabel={formatPageOf(copy.pageOf, page, pageCount)}
          previousLabel={c.paginationPrevious}
          nextLabel={c.paginationNext}
          onPrevious={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ro-muted">
          P24 Divider
        </p>
        <Divider variant="hairline" />
        <Divider variant="grain" />
        <div className="flex h-16 items-center gap-4">
          <span className="text-sm text-ro-muted">axis</span>
          <Divider variant="axis" />
          <span className="text-sm text-ro-muted">48px</span>
        </div>
      </div>
    </div>
  );
}

export function PrimitivesB2Gallery({ copy }: { copy: PrimitivesB2Copy }) {
  return (
    <ToastProvider dismissLabel={copy.dict.common.toastDismiss}>
      <div className="space-y-8">
        <Surface inverse={false} title={copy.sectionLight} copy={copy} />
        <Surface inverse title={copy.sectionInverse} copy={copy} />
      </div>
    </ToastProvider>
  );
}
