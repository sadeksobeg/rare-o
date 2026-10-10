export type SpecRow = { label: string; value: string };

export type ParsedSpecs = {
  rows: SpecRow[];
  /** Lines without a `label: value` shape (or the whole text when none match). */
  prose: string;
};

const MAX_LABEL_LENGTH = 48;

/**
 * D34: specs are free text. Lines shaped `label: value` become table rows;
 * everything else is kept as a prose block (never dropped).
 */
export function parseSpecs(text: string | null | undefined): ParsedSpecs {
  const rows: SpecRow[] = [];
  const proseLines: string[] = [];

  for (const raw of (text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const match = line.match(/^([^:：]+)[:：]\s*(.+)$/);
    const label = match?.[1].trim();
    const value = match?.[2].trim();
    if (label && value && label.length <= MAX_LABEL_LENGTH) {
      rows.push({ label, value });
    } else {
      proseLines.push(line);
    }
  }

  return { rows, prose: proseLines.join("\n") };
}
