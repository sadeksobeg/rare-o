import type { LegalDocument } from "@/lib/content/legal";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Props = {
  doc: LegalDocument;
  dict: Dictionary;
  /** Fallback banner when markdown has no banner but placeholders remain. */
  placeholderBanner?: string;
};

export function LegalDocumentView({ doc, dict, placeholderBanner }: Props) {
  const sections = doc.sections.length
    ? doc.sections
    : doc.fallbackBody
      ? [{ id: "content", title: doc.title, body: doc.fallbackBody }]
      : [];

  const banner =
    doc.banner ||
    (doc.isPlaceholder ? placeholderBanner : undefined);

  const updatedLabel =
    doc.lastUpdated ||
    (dict.privacy.updated.startsWith("Last updated")
      ? dict.privacy.updated
      : dict.privacy.updated);

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      {sections.length > 1 ? (
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
      ) : (
        <div className="hidden lg:block" aria-hidden />
      )}

      <article className="max-w-[720px] space-y-8">
        <header className="space-y-3">
          <h1 className="ro-type-h1">{doc.title}</h1>
          {updatedLabel ? (
            <p className="text-sm text-ro-muted">{updatedLabel}</p>
          ) : null}
          {banner ? (
            <p
              role="note"
              className="border border-[var(--ro-attention-border,var(--ro-line))] bg-[var(--ro-attention-100,var(--ro-sunken))] px-4 py-3 text-sm text-ro-ink"
            >
              {banner}
            </p>
          ) : null}
        </header>
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28 space-y-3">
            {sections.length > 1 ? (
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {s.title}
              </h2>
            ) : null}
            <div className="space-y-3 leading-relaxed text-ro-text-2 whitespace-pre-wrap">
              {s.body}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}
