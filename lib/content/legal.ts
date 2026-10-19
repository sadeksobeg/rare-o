import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Locale } from "@/lib/i18n/config";

export type LegalDocKind = "privacy" | "terms" | "cookies";

export type LegalSection = {
  id: string;
  title: string;
  body: string;
};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  isPlaceholder: boolean;
  banner?: string;
  description?: string;
  sections: LegalSection[];
  /** Raw markdown body when no ## sections were parsed. */
  fallbackBody?: string;
};

const ROOT = path.join(process.cwd(), "content", "legal");

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw.trim() };
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { meta, body: match[2].trim() };
}

function parseSections(body: string): LegalSection[] {
  const sections: LegalSection[] = [];
  const re = /^##\s+(.+?)(?:\s+\{#([a-z0-9-]+)\})?\s*$/gim;
  const matches = [...body.matchAll(re)];
  if (!matches.length) return sections;

  for (let i = 0; i < matches.length; i += 1) {
    const m = matches[i];
    const title = m[1].trim();
    const id =
      m[2]?.trim() ||
      title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-|-$/g, "") ||
      `section-${i + 1}`;
    const start = (m.index ?? 0) + m[0].length;
    const end =
      i + 1 < matches.length
        ? (matches[i + 1].index ?? body.length)
        : body.length;
    const sectionBody = body.slice(start, end).trim();
    sections.push({ id, title, body: sectionBody });
  }
  return sections;
}

export async function loadLegalDocument(
  kind: LegalDocKind,
  locale: Locale
): Promise<LegalDocument | null> {
  const file = path.join(ROOT, `${kind}.${locale}.md`);
  try {
    const raw = await readFile(file, "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const sections = parseSections(body);
    return {
      title: meta.title || kind,
      lastUpdated: meta.lastUpdated || "",
      isPlaceholder: meta.isPlaceholder === "true",
      banner: meta.banner || undefined,
      description: meta.description || undefined,
      sections,
      fallbackBody: sections.length ? undefined : body || undefined,
    };
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return null;
    throw e;
  }
}
