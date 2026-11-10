import type { Locale } from "@/lib/i18n/config";
import { APP_TIMEZONE } from "@/lib/i18n/format";
import { formatAdminTime } from "@/lib/i18n/admin-format";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** «10 نوفمبر 17:57» — Latin digits, Arabic month; wrapped by caller in bdi. */
export function formatKillSwitchWhen(
  value: string | null | undefined,
  locale: Locale
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const dayMonth = new Intl.DateTimeFormat(`${locale}-u-nu-latn-ca-gregory`, {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "long",
  }).format(date);
  return `${dayMonth} ${formatAdminTime(date, locale)}`;
}

export function KillSwitchBannerText({
  ib,
  locale,
  by,
  at,
  reason,
}: {
  ib: Dictionary["ib"];
  locale: Locale;
  by: string | null;
  at: string | null;
  reason: string | null;
}) {
  const when = formatKillSwitchWhen(at, locale);
  return (
    <span>
      {ib.bannerKillSwitch}
      {by ? (
        <>
          {" — "}
          {ib.killStoppedBy}{" "}
          <bdi dir="ltr">{by}</bdi>
          {when ? (
            <>
              {" · "}
              <bdi dir="ltr">{when}</bdi>
            </>
          ) : null}
          {reason ? (
            <>
              {" · "}
              {ib.killReasonPrefix}: {reason}
            </>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
