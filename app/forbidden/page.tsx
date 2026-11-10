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
    <main
      data-portal={role === "admin" ? "admin" : role === "trader" ? "trader" : "admin"}
      data-theme="dark"
      className="ro-portal flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[color:var(--rad-c0,#0B080D)] px-6 py-16 text-center"
      style={{ color: "var(--rad-tx, #F4E7D8)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in srgb, var(--rad-ac, #C4A0EA) 14%, transparent), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
        <div className="rad-rg mb-8 opacity-70" aria-hidden>
          <Rings className="h-28 w-28 text-[color:var(--rad-ac,#C4A0EA)]" />
        </div>
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: "var(--rad-font, inherit)" }}
        >
          {dict.common.errorForbidden}
        </h1>
        <p className="mt-3" style={{ color: "var(--rad-tx2)" }}>
          {dict.common.errorBody}
        </p>
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
          <ButtonLink href="/" variant="secondary">
            {dict.nav.home}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
