import { MessageSquareText } from "lucide-react";
import { getRequestDictionary } from "@/lib/i18n/server";

/**
 * No conversation selected — desktop shows this in the thread column;
 * mobile shows the list instead (CSS-driven, see .rad-ibx.rad-tv).
 */
export default async function AdminWhatsAppInboxPage() {
  const { locale, dict } = await getRequestDictionary();
  const ib = dict.ib;
  const keyJoin = locale === "ar" ? " و " : " and ";

  return (
    <>
      <section key="select" className="rad-ct" aria-label={dict.inbox.title}>
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
            <p>
              {ib.selectConvHintBefore}{" "}
              <bdi dir="ltr">J</bdi>
              {keyJoin}
              <bdi dir="ltr">K</bdi> {ib.selectConvHintAfter}
            </p>
          </div>
        </div>
      </section>
      <aside key="ctx-placeholder" className="rad-xp" aria-hidden="true" />
    </>
  );
}
