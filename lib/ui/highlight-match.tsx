import type { ReactNode } from "react";

/** SYS-03 — wrap query matches in <mark> for command/search results. */
export function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q || !text) return text;

  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let guard = 0;

  while (cursor < text.length && guard < 32) {
    guard += 1;
    const at = lower.indexOf(needle, cursor);
    if (at < 0) {
      parts.push(text.slice(cursor));
      break;
    }
    if (at > cursor) parts.push(text.slice(cursor, at));
    parts.push(
      <mark
        key={`${at}-${guard}`}
        className="rounded-[2px] bg-[color-mix(in_srgb,var(--ro-plum-900)_18%,transparent)] text-inherit"
      >
        {text.slice(at, at + needle.length)}
      </mark>
    );
    cursor = at + needle.length;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
