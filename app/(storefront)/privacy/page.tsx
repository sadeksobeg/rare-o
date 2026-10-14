import type { Metadata } from "next";
import { getRequestDictionary } from "@/lib/i18n/server";
import { storefrontMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  return storefrontMetadata({
    locale,
    title: `${dict.privacy.title} — ${dict.brand}`,
    description: dict.seo.privacyDescription,
    path: "/privacy",
  });
}

export default async function PrivacyPage() {
  const { dict } = await getRequestDictionary();
  const sections = [
    { id: "collect", title: dict.privacy.s1Title, body: dict.privacy.s1Body },
    { id: "use", title: dict.privacy.s2Title, body: dict.privacy.s2Body },
    { id: "cookies", title: dict.privacy.s3Title, body: dict.privacy.s3Body },
  ];

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <nav
          aria-label={dict.privacy.tocLabel}
          className="sticky top-24 space-y-3 border-s border-ro-line ps-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ro-muted">
            {dict.privacy.tocLabel}
          </p>
          <ul className="space-y-2 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-ro-text-2 hover:text-ro-ink hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <article className="max-w-[720px] space-y-8">
        <header className="space-y-3">
          <h1 className="ro-type-h1">{dict.privacy.title}</h1>
          <p className="text-sm text-ro-muted">{dict.privacy.updated}</p>
          <p
            role="note"
            className="border border-[var(--ro-attention-border,var(--ro-line))] bg-[var(--ro-attention-100,var(--ro-sunken))] px-4 py-3 text-sm text-ro-ink"
          >
            {dict.privacy.placeholderBanner}
          </p>
        </header>
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28 space-y-3">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {s.title}
            </h2>
            <p className="leading-relaxed text-ro-text-2">{s.body}</p>
          </section>
        ))}
      </article>
    </div>
  );
}
