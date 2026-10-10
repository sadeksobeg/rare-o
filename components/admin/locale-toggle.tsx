"use client";

import { setLocaleAction } from "@/app/actions";
import type { Locale } from "@/lib/i18n/config";
import { useRouter } from "next/navigation";

export function AdminLocaleToggle({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const router = useRouter();
  const nextLocale: Locale = locale === "ar" ? "en" : "ar";

  return (
    <form
      action={async () => {
        await setLocaleAction(nextLocale);
        router.refresh();
      }}
    >
      <button
        type="submit"
        className="border border-ro-line px-3 py-1 text-ro-muted hover:text-ro-black"
      >
        {label}
      </button>
    </form>
  );
}
