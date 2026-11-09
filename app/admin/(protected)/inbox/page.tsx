import { MessageSquareText } from "lucide-react";
import { getRequestDictionary } from "@/lib/i18n/server";

/**
 * No conversation selected — desktop shows this in the thread column;
 * mobile shows the list instead (CSS-driven, see .rad-ibx.rad-tv).
 */
export default async function AdminWhatsAppInboxPage() {
  const { dict } = await getRequestDictionary();
  const ib = dict.ib;

  return (
    <>
      <section className="rad-ct" aria-label={dict.inbox.title}>
        <div className="rad-ept">
          <div>
            <div className="rad-rg">
              <svg viewBox="0 0 150 150" fill="none" stroke="currentColor">
                <circle cx="75" cy="75" r="26" />
                <circle cx="75" cy="75" r="46" />
                <circle cx="75" cy="75" r="68" />
              </svg>
              <i>
                <MessageSquareText width={30} height={30} strokeWidth={1.5} aria-hidden />
              </i>
            </div>
            <b>{ib.selectConvTitle}</b>
            <p>{ib.selectConvBody}</p>
          </div>
        </div>
      </section>
      <aside className="rad-xp" aria-hidden />
    </>
  );
}
