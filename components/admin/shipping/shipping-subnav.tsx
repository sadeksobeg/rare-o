"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/shipping", labelAr: "نظرة عامة", labelEn: "Overview", exact: true },
  { href: "/admin/shipping/countries", labelAr: "الدول", labelEn: "Countries" },
  { href: "/admin/shipping/methods", labelAr: "الطرق", labelEn: "Methods" },
  { href: "/admin/shipping/rates", labelAr: "الأسعار", labelEn: "Rates" },
  { href: "/admin/shipping/simulator", labelAr: "جرّب السعر", labelEn: "Simulator" },
  { href: "/admin/shipping/import", labelAr: "استيراد", labelEn: "Import" },
  { href: "/admin/shipping/shipments", labelAr: "الشحنات", labelEn: "Shipments" },
  { href: "/admin/shipping/inquiries", labelAr: "الاستفسارات", labelEn: "Inquiries" },
  { href: "/admin/shipping/config", labelAr: "الإعدادات", labelEn: "Config" },
] as const;

export function ShippingSubnav({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const pathname = usePathname() || "/admin/shipping";
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-[color:var(--rad-bd)] pb-3"
      aria-label={ar ? "أقسام الشحن" : "Shipping sections"}
    >
      {LINKS.map((link) => {
        const exact = "exact" in link && link.exact;
        const active = exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-[background-color,color,opacity] duration-150",
              active
                ? "bg-[color:var(--rad-ac)] text-[color:var(--rad-ac-fg,white)]"
                : "bg-[color:var(--rad-c1)] text-[color:var(--rad-tx)] hover:bg-[color:var(--rad-c2)]"
            )}
          >
            {ar ? link.labelAr : link.labelEn}
          </Link>
        );
      })}
    </nav>
  );
}
