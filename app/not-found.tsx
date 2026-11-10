import { ErrorGrainIllustration } from "@/components/brand/icons/error-grain";
import { ButtonLink } from "@/components/ui/button";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const { dict } = await getRequestDictionary();

  return (
    <main
      data-portal="admin"
      data-theme="dark"
      className="ro-portal flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[color:var(--rad-c0,#0B080D)] px-6 py-16 text-center"
      style={{ color: "var(--rad-tx, #F4E7D8)" }}
    >
      {/* SF-10: 404 must stay out of search indexes */}
      <meta name="robots" content="noindex, nofollow" />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
        <ErrorGrainIllustration className="mb-6 h-40 w-40 text-[color:var(--rad-tx)] opacity-80" />
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: "var(--rad-font, inherit)" }}
        >
          {dict.common.errorNotFound}
        </h1>
        <p className="mt-3" style={{ color: "var(--rad-tx2)" }}>
          {dict.common.errorBody}
        </p>

        <form
          action="/catalog"
          method="get"
          className="mt-8 w-full max-w-sm space-y-2 text-start"
        >
          <label className="block text-sm font-medium" style={{ color: "var(--rad-tx)" }}>
            {dict.catalog.searchLabel}
            <input
              type="search"
              name="q"
              placeholder={dict.catalog.search}
              className="rad-inp mt-1.5"
            />
          </label>
          <button type="submit" className="rad-btn rad-pri w-full justify-center">
            {dict.catalog.search}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="primary">
            {dict.nav.home}
          </ButtonLink>
          <ButtonLink href="/catalog" variant="secondary">
            {dict.nav.catalog}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
