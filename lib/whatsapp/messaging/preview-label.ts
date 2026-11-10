/**
 * Presentation-only mapping of stored WhatsApp preview / body tags to
 * human labels. Never invents business state — only hides raw tokens like
 * `[unsupported:sticker]` or `[image]` from the admin UI.
 */

export type InboxPreviewLabels = {
  sticker: string;
  image: string;
  video: string;
  audio: string;
  document: string;
  location: string;
  contact: string;
  reaction: string;
  unsupported: string;
  empty: string;
};

const KIND_ALIASES: Record<string, keyof Omit<InboxPreviewLabels, "empty">> = {
  sticker: "sticker",
  image: "image",
  video: "video",
  audio: "audio",
  ptt: "audio",
  voice: "audio",
  document: "document",
  file: "document",
  location: "location",
  contact: "contact",
  contacts: "contact",
  vcard: "contact",
  reaction: "reaction",
  unknown: "unsupported",
  unsupported: "unsupported",
};

function labelForKind(kind: string | undefined, labels: InboxPreviewLabels): string {
  if (!kind) return labels.unsupported;
  const key = KIND_ALIASES[kind.toLowerCase()];
  if (!key) return labels.unsupported;
  return labels[key];
}

/**
 * Turn a stored preview/body string into a safe UI label.
 * Plain text messages pass through unchanged.
 */
export function humanizeInboxPreview(
  raw: string | null | undefined,
  labels: InboxPreviewLabels
): string {
  const text = (raw ?? "").trim();
  if (!text || text === "—") return labels.empty;

  const unsupported = text.match(/^\[unsupported(?::([^\]]*))?\]$/i);
  if (unsupported) {
    return labelForKind(unsupported[1]?.trim() || undefined, labels);
  }

  const bracket = text.match(
    /^\[(sticker|image|video|audio|ptt|voice|document|file|location|contact|contacts|vcard|reaction|unknown)\](?:\s+(.+))?$/i
  );
  if (bracket) {
    const kind = bracket[1]!;
    const rest = bracket[2]?.trim();
    // Keep a real filename when present for documents; otherwise show the kind label.
    if (rest && /^(document|file)$/i.test(kind)) return rest;
    return labelForKind(kind, labels);
  }

  // Any other single-bracket token is an internal marker — never show raw.
  if (/^\[[^\]]+\]$/.test(text)) return labels.unsupported;

  return text;
}

/** Prefer caption, else humanize body using messageType when body is a tag. */
export function humanizeMessageBody(
  body: string | null | undefined,
  messageType: string | null | undefined,
  caption: string | null | undefined,
  labels: InboxPreviewLabels
): string {
  const cap = caption?.trim();
  if (cap) return humanizeInboxPreview(cap, labels);

  const text = (body ?? "").trim();
  if (text && !/^\[/.test(text)) return text;

  const fromBody = humanizeInboxPreview(text, labels);
  if (fromBody !== labels.empty && fromBody !== labels.unsupported) return fromBody;

  if (messageType && messageType !== "text" && messageType !== "system") {
    return labelForKind(messageType, labels);
  }

  return fromBody === labels.empty ? labels.empty : fromBody;
}
