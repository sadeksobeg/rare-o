import type { Metadata } from "next";
import Link from "next/link";
import { Rings } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { getRequestDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SessionExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const { portal } = await searchParams;
  const { dict } = await getRequestDictionary();
  const loginHref =
    portal === "trader"
      ? "/trader/login?notice=session_invalidated"
      : portal === "admin"
        ? "/admin/login?notice=session_invalidated"
        : "/";

  return (
    <main className="relative mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--ro-plum-900)_12%,transparent),transparent_55%)]"
        aria-hidden
      />
      <Rings className="mb-6 h-24 w-24 text-ro-ink opacity-30" />
      <h1 className="ro-type-h1">{dict.common.errorSession}</h1>
      <p className="mt-3 text-ro-text-2">{dict.common.errorBody}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {portal === "admin" || portal === "trader" ? (
          <ButtonLink href={loginHref} variant="primary">
            {dict.common.signIn}
          </ButtonLink>
        ) : (
          <ButtonLink href="/" variant="primary">
            {dict.nav.home}
          </ButtonLink>
        )}
        <Link
          href="/"
          className="inline-flex h-11 items-center px-4 text-sm text-[var(--ro-plum-900)] hover:underline"
        >
          {dict.nav.home}
        </Link>
      </div>
    </main>
  );
}
