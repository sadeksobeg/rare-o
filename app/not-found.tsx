import Link from "next/link";
import { Rings } from "@/components/brand";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const { locale, dict } = await getRequestDictionary();
  const title =
    locale === "ar" ? "الصفحة غير موجودة" : "Page not found";
  const body =
    locale === "ar"
      ? "تعذّر العثور على هذه الصفحة."
      : "This page could not be found.";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <Rings className="mb-6 h-24 w-24 text-ro-ink opacity-30" />
      <h1 className="ro-type-h1">{title}</h1>
      <p className="mt-3 text-ro-text-2">{body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
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
