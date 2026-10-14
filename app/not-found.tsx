import Link from "next/link";
import { Rings } from "@/components/brand";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const { dict } = await getRequestDictionary();

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      {/* SF-10: 404 must stay out of search indexes */}
      <meta name="robots" content="noindex, nofollow" />
      <Rings className="mb-6 h-24 w-24 text-ro-ink opacity-30" />
      <h1 className="ro-type-h1">{dict.common.errorNotFound}</h1>
      <p className="mt-3 text-ro-text-2">{dict.common.errorBody}</p>

      <form
        action="/catalog"
        method="get"
        className="mt-8 w-full max-w-sm space-y-2 text-start"
      >
        <label className="block text-sm font-medium text-ro-ink">
          {dict.catalog.searchLabel}
          <input
            type="search"
            name="q"
            placeholder={dict.catalog.search}
            className="mt-1.5 h-12 w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 text-ro-ink outline-none focus:border-[var(--ro-plum-900)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ro-focus)]"
          />
        </label>
        <button
          type="submit"
          className="h-11 w-full rounded-[var(--ro-r-sm)] border border-ro-ink px-4 text-sm font-semibold"
        >
          {dict.catalog.search}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        <Link
          href="/"
          className="rounded-[var(--ro-r-sm)] bg-ro-ink px-5 py-3 font-semibold text-ro-canvas"
        >
          {dict.nav.home}
        </Link>
        <Link
          href="/catalog"
          className="rounded-[var(--ro-r-sm)] border border-ro-ink px-5 py-3 font-semibold"
        >
          {dict.nav.catalog}
        </Link>
      </div>
    </main>
  );
}
