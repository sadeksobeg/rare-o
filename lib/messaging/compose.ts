/**
 * One layout for every outbound customer/trader message (WhatsApp + platform chat):
 * greeting, bold headline, short context, optional detail lines, a clearly separated link, signature.
 * Blank lines between blocks keep long messages readable; *bold* renders in WhatsApp.
 */
export type ComposeInput = {
  ar: boolean;
  /** Full or first name — only the first word is used in the greeting. */
  name?: string;
  headline: string;
  context?: string;
  details?: (string | null | undefined | false)[];
  note?: string | null;
  linkLabel?: string;
  link?: string;
};

export function firstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

export function composeMessage(m: ComposeInput): string {
  const first = firstName(m.name);
  const blocks: string[] = [];
  blocks.push(m.ar ? (first ? `مرحباً ${first}،` : "مرحباً،") : first ? `Hello ${first},` : "Hello,");
  blocks.push([`*${m.headline}*`, ...(m.context ? [m.context] : [])].join("\n"));
  const details = (m.details ?? []).filter((d): d is string => Boolean(d));
  if (details.length) blocks.push(details.join("\n"));
  if (m.note?.trim()) blocks.push(m.note.trim());
  if (m.link) blocks.push(`${m.linkLabel ?? (m.ar ? "التفاصيل:" : "Details:")}\n${m.link}`);
  blocks.push("RARE OUD");
  return blocks.join("\n\n");
}
