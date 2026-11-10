import { Suspense } from "react";
import {
  AdminDashboardContent,
  AdminDashboardSkeleton,
} from "@/components/admin/rad/dashboard-content";
import { getAdminHomeData } from "@/lib/admin/dashboard";
import { getAdminSessionChrome } from "@/lib/auth/admin-session";
import { greetingHeadline } from "@/lib/i18n/greeting";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

async function AdminDashboardBody({
  locale,
  dict,
  greeting,
}: {
  locale: Awaited<ReturnType<typeof getRequestDictionary>>["locale"];
  dict: Awaited<ReturnType<typeof getRequestDictionary>>["dict"];
  greeting: string;
}) {
  const data = await getAdminHomeData();
  return (
    <AdminDashboardContent locale={locale} dict={dict} greeting={greeting} data={data} />
  );
}

export default async function AdminDashboardPage() {
  const { locale, dict } = await getRequestDictionary();
  const session = await getAdminSessionChrome();
  const greeting = greetingHeadline(session?.name, dict.common);

  return (
    <section data-admin-home className="relative w-full min-w-0 max-w-none rad-root">
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboardBody locale={locale} dict={dict} greeting={greeting} />
      </Suspense>
    </section>
  );
}
