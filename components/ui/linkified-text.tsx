import type { ReactNode } from "react";

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"'،؛]+)/gi;
const TRAILING = /[.,;:!?)\]}»”’،؛؟]+$/;

/**
 * Renders plain text with http(s)/www links turned into real anchors.
 * Text is never injected as HTML — only split into strings and <a> nodes.
 * Links are always LTR (<bdi dir="ltr">) so Arabic text around them cannot scramble the URL.
 */
export function LinkifiedText({
  text,
  linkClassName,
}: {
  text: string;
  linkClassName?: string;
}) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(URL_RE)) {
    const start = m.index ?? 0;
    let url = m[1] ?? "";
    const trail = url.match(TRAILING)?.[0] ?? "";
    if (trail) url = url.slice(0, url.length - trail.length);
    if (!url) continue;
    if (start > last) nodes.push(text.slice(last, start));
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    nodes.push(
      <a
        key={`l${key++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={
          linkClassName ??
          "break-all font-medium underline decoration-[1.5px] underline-offset-[3px] hover:opacity-80"
        }
      >
        <bdi dir="ltr">{url}</bdi>
      </a>
    );
    last = start + url.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
