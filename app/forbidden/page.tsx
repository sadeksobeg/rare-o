import Link from "next/link";
import { Rings } from "@/components/brand";
import { adminLogoutAction } from "@/app/admin-logout-action";
import { traderLogoutAction } from "@/app/deal-actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const { portal } = await searchParams;
  const { dict } = await getRequestDictionary();
  const role = portal === "admin" ? "admin" : portal === "trader" ? "trader" : null;
  const portalHref = role === "admin" ? "/admin" : role === "trader" ? "/trader" : "/";
  const logoutAction =
    role === "admin"
      ? adminLogoutAction
      : role === "trader"
        ? traderLogoutAction
        : null;

  return (
    <main className="relative mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--ro-plum-900)_12%,transparent),transparent_55%)]"
        aria-hidden
      />
      <Rings className="mb-6 h-24 w-24 text-ro-ink opacity-30" />
      <h1 className="ro-type-h1">{dict.common.errorForbidden}</h1>
      <p className="mt-3 text-ro-text-2">{dict.common.errorBody}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {role ? (
          <ButtonLink href={portalHref} variant="primary">
            {dict.common.goToPortal}
          </ButtonLink>
        ) : (
          <ButtonLink href="/" variant="primary">
            {dict.nav.home}
          </ButtonLink>
        )}
        {logoutAction ? (
          <form action={logoutAction}>
            <Button type="submit" variant="secondary">
              {dict.common.signOut}
            </Button>
          </form>
        ) : null}
        <Link
          href="/"
          className="inline-flex h-11 items-center px-4 text-sm text-ro-plum hover:underline"
        >
          {dict.nav.home}
        </Link>
      </div>
    </main>
  );
}
