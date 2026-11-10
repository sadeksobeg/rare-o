import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxPreviewLabels } from "@/lib/whatsapp/messaging/preview-label";

export function inboxPreviewLabels(ib: Dictionary["ib"]): InboxPreviewLabels {
  return {
    sticker: ib.previewSticker,
    image: ib.previewImage,
    video: ib.previewVideo,
    audio: ib.previewAudio,
    document: ib.previewDocument,
    location: ib.previewLocation,
    contact: ib.previewContact,
    reaction: ib.previewReaction,
    unsupported: ib.previewUnsupported,
    empty: ib.previewEmpty,
  };
}
