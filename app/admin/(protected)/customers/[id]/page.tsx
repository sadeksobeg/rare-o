import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare, Package } from "lucide-react";
import { CustomerDetailTabs } from "@/components/admin/rad/customer-detail-tabs";
import { CustomerEditForm } from "@/components/admin/customer-edit-form";
import { CustomerNotesForm } from "@/components/admin/customer-notes-form";
import { RevealPhone } from "@/components/admin/reveal-phone";
import {
  Avatar,
  Card,
  CardHeader,
  DetailBack,
  DetailHeader,
  KeyValue,
  Pill,
} from "@/components/ui-kit";
import { findWhatsAppConversationsForPhone } from "@/lib/admin/wa-phone-match";
import { prisma } from "@/lib/db/prisma";
import { formatAdminDate } from "@/lib/i18n/admin-format";
import { formatRequestCountLabel } from "@/lib/i18n/request-count";
import { getRequestDictionary } from "@/lib/i18n/server";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { getStatusChipProps } from "@/lib/ui/status-labels";

export const dynamic = "force-dynamic";

const TABS = new Set(["overview", "requests", "conversations", "notes"]);

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    notesSaved?: string;
    notesError?: string;
  }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const tabRaw = q.tab?.trim() || "overview";
  const tab = TABS.has(tabRaw) ? tabRaw : "overview";
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const ar = locale === "ar";

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { requests: true } },
      requests: {
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          reference: true,
          status: true,
          createdAt: true,
          subtotal: true,
          currency: true,
        },
      },
      whatsAppConversations: {
        orderBy: { lastMessageAt: "desc" },
        take: 10,
        select: {
          id: true,
          displayName: true,
          participantE164: true,
          lastMessageAt: true,
          lastMessagePreview: true,
          unreadCount: true,
        },
      },
    },
  });
  if (!customer) notFound();

  const phoneMatched = await findWhatsAppConversationsForPhone(customer.phone);
  const linkedIds = new Set(customer.whatsAppConversations.map((c) => c.id));
  const waConversations = [
    ...customer.whatsAppConversations,
    ...phoneMatched.filter((c) => !linkedIds.has(c.id)),
  ];
  const primaryWa = waConversations[0];
  const notesLen = customer.notes?.trim() ? 1 : 0;

  return (
    <section data-admin-customer-detail="" className="pb-8">
      <DetailBack href="/admin/customers">{a.customers}</DetailBack>

      <DetailHeader
        reference={customer.name}
        mono={false}
        meta={
          <span className="inline-flex flex-wrap items-center gap-2">
            <RevealPhone
              phone={customer.phone}
              showLabel={u.showPhone}
              hideLabel={u.hidePhone}
            />
            <span>·</span>
            <span>
              {formatRequestCountLabel(
                customer._count.requests,
                locale,
                u.colRequests
              )}
            </span>
            <span>·</span>
            <span>
              <span className="rad-nowrap">
                {formatAdminDate(customer.createdAt, locale, {
                  forceAbsolute: true,
                })}
              </span>
            </span>
          </span>
        }
        actions={
          <>
            {customer._count.requests > 0 ? (
              <Link
                href={`/admin/requests?q=${encodeURIComponent(customer.phone)}`}
                className="rad-btn rad-gh"
              >
                <Package width={16} height={16} strokeWidth={1.5} aria-hidden />
                {u.customerOpenRequests}
              </Link>
            ) : null}
            {primaryWa ? (
              <Link
                href={`/admin/inbox/${primaryWa.id}`}
                className="rad-btn rad-pri"
              >
                <MessageSquare
                  width={16}
                  height={16}
                  strokeWidth={1.5}
                  aria-hidden
                />
                {u.customerOpenWa}
              </Link>
            ) : null}
          </>
        }
      />

      <CustomerDetailTabs
        customerId={customer.id}
        tab={tab}
        counts={{
          overview: 0,
          requests: customer._count.requests,
          conversations: waConversations.length,
          notes: notesLen,
        }}
        labels={{
          aria: ar ? "أقسام العميل" : "Customer sections",
          overview: ar ? "نظرة عامة" : "Overview",
          requests: a.requests,
          conversations: u.customerWaTitle,
          notes: ar ? "ملاحظات" : "Notes",
        }}
      />

      {tab === "overview" ? (
        <div className="rad-dgrid">
          <div className="rad-stack">
            <Card padded={false}>
              <CardHeader title={ar ? "الملف" : "Profile"} />
              <div className="rad-cb2">
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Avatar>
                    {(customer.name.trim()[0] || "?").toUpperCase()}
                  </Avatar>
                  <div>
                    <b>{customer.name}</b>
                    <div style={{ color: "var(--rad-tx3)", fontSize: 12.5 }}>
                      {formatRequestCountLabel(
                        customer._count.requests,
                        locale,
                        u.colRequests
                      )}
                    </div>
                  </div>
                </div>
                <KeyValue
                  items={[
                    {
                      label: u.colPhone,
                      value: (
                        <RevealPhone
                          phone={customer.phone}
                          showLabel={u.showPhone}
                          hideLabel={u.hidePhone}
                        />
                      ),
                    },
                    {
                      label: u.colCreated,
                      value: (
                        <span className="rad-nowrap">
                          {formatAdminDate(customer.createdAt, locale, {
                            forceAbsolute: true,
                            withTime: true,
                          })}
                        </span>
                      ),
                    },
                    {
                      label: u.colRequests,
                      value: formatRequestCountLabel(
                        customer._count.requests,
                        locale,
                        u.colRequests
                      ),
                    },
                  ]}
                />
              </div>
            </Card>
            <Card padded={false}>
              <CardHeader title={ar ? "تعديل" : "Edit"} />
              <div className="rad-cb2">
                <CustomerEditForm
                  bare
                  customerId={customer.id}
                  name={customer.name}
                  phone={customer.phone}
                  dict={dict}
                  locale={locale}
                />
              </div>
            </Card>
          </div>
          <aside className="rad-stack">
            <Card padded={false}>
              <CardHeader title={u.customerWaTitle} />
              <div className="rad-cb2">
                {waConversations.length === 0 ? (
                  <p style={{ color: "var(--rad-tx3)", fontSize: 13 }}>
                    {u.customerWaEmpty}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {waConversations.slice(0, 3).map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/admin/inbox/${c.id}`}
                          className="rad-rec"
                          style={{ margin: 0, display: "flex" }}
                        >
                          <span className="rad-chip rad-c-ok">
                            <MessageSquare
                              width={16}
                              height={16}
                              strokeWidth={1.5}
                              aria-hidden
                            />
                          </span>
                          <div className="rad-tt">
                            <b>
                              <bdi>
                                {c.displayName || c.participantE164 || c.id}
                              </bdi>
                            </b>
                            <span>
                              {c.lastMessageAt
                                ? formatAdminDate(c.lastMessageAt, locale)
                                : "—"}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
            <Card padded={false}>
              <CardHeader title={a.requests} />
              <div className="rad-cb2">
                {customer.requests.length === 0 ? (
                  <p style={{ color: "var(--rad-tx3)", fontSize: 13 }}>
                    {a.noRequests}
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {customer.requests.slice(0, 5).map((r) => {
                      const chip = getStatusChipProps(dict, "retail", r.status);
                      return (
                        <li
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <Link
                            href={`/admin/requests/${r.id}`}
                            className="rad-lnk"
                          >
                            {r.reference}
                          </Link>
                          <Pill tone={statusToneToPill(chip.tone)}>
                            {chip.label}
                          </Pill>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>
          </aside>
        </div>
      ) : null}

      {tab === "requests" ? (
        <Card padded={false}>
          <CardHeader title={a.requests} count={customer.requests.length} />
          <div className="rad-cb2">
            {customer.requests.length === 0 ? (
              <p style={{ color: "var(--rad-tx3)", fontSize: 13 }}>
                {a.noRequests}
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--rad-bd)" }}>
                {customer.requests.map((r) => {
                  const chip = getStatusChipProps(dict, "retail", r.status);
                  return (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <Link
                          href={`/admin/requests/${r.id}`}
                          className="rad-lnk"
                        >
                          {r.reference}
                        </Link>
                        <p
                          className="text-xs"
                          style={{ color: "var(--rad-tx3)" }}
                        >
                          {formatAdminDate(r.createdAt, locale)}
                        </p>
                      </div>
                      <Pill tone={statusToneToPill(chip.tone)}>
                        {chip.label}
                      </Pill>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      ) : null}

      {tab === "conversations" ? (
        <Card padded={false}>
          <CardHeader
            title={u.customerWaTitle}
            count={waConversations.length}
          />
          <div className="rad-cb2">
            {waConversations.length === 0 ? (
              <p style={{ color: "var(--rad-tx3)", fontSize: 13 }}>
                {u.customerWaEmpty}
              </p>
            ) : (
              <ul className="space-y-2">
                {waConversations.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/admin/inbox/${c.id}`}
                      className="rad-rec"
                      style={{ margin: 0, display: "flex" }}
                    >
                      <span className="rad-chip rad-c-ok">
                        <MessageSquare
                          width={16}
                          height={16}
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </span>
                      <div className="rad-tt">
                        <b>
                          <bdi>
                            {c.displayName || c.participantE164 || c.id}
                          </bdi>
                        </b>
                        <span>
                          {c.lastMessagePreview
                            ? c.lastMessagePreview
                            : c.lastMessageAt
                              ? formatAdminDate(c.lastMessageAt, locale)
                              : "—"}
                          {c.unreadCount > 0
                            ? ` · ${c.unreadCount}`
                            : ""}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      ) : null}

      {tab === "notes" ? (
        <Card padded={false}>
          <CardHeader title={ar ? "ملاحظات" : "Notes"} />
          <div className="rad-cb2">
            <CustomerNotesForm
              customerId={customer.id}
              notes={customer.notes ?? ""}
              dict={dict}
              saved={q.notesSaved === "1"}
              error={Boolean(q.notesError)}
            />
          </div>
        </Card>
      ) : null}
    </section>
  );
}
