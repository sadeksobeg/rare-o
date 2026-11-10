"use client";

import { Gem, Percent, Sparkles, Star } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export type ProductBadgeFlags = {
  badgeNew?: boolean;
  badgeFeatured?: boolean;
  badgeSale?: boolean;
  /** Plain numbers only — this is a Client Component, Prisma Decimal can't cross the boundary. */
  compareAtPrice?: number | null;
  retailPrice?: number | null;
  categorySlug?: string;
};

const copy = {
  ar: { neu: "جديد", featured: "مميّز", sale: "خصم" },
  en: { neu: "New", featured: "Featured", sale: "Sale" },
} as const;

const tierCopy = {
  ar: {
    "oud-economy": "اقتصادي",
    "oud-mid": "متوسط",
    "oud-professional": "احترافي",
    "oud-vip": "VIP",
  },
  en: {
    "oud-economy": "Economy",
    "oud-mid": "Mid",
    "oud-professional": "Pro",
    "oud-vip": "VIP",
  },
} as const;

const tierTone: Record<string, string> = {
  "oud-economy": "bg-[var(--ro-sand-200)] text-ro-ink",
  "oud-mid": "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]",
  "oud-professional": "bg-[var(--ro-plum-800)] text-ro-canvas",
  "oud-vip": "bg-[var(--ro-amber-500)] text-ro-ink",
};

export function ProductBadges({
  product,
  locale,
  className,
}: {
  product: ProductBadgeFlags;
  locale: Locale;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const t = copy[locale] ?? copy.en;
  const tiers = tierCopy[locale] ?? tierCopy.en;
  const compare =
    product.compareAtPrice != null ? Number(product.compareAtPrice) : null;
  const price =
    product.retailPrice != null ? Number(product.retailPrice) : null;
  const saleFromPrice =
    compare != null && price != null && compare > price;
  const showSale = product.badgeSale || saleFromPrice;
  const percentOff =
    saleFromPrice && compare
      ? Math.round(((compare - price!) / compare) * 100)
      : null;
  const slug = product.categorySlug;
  const tierLabel =
    slug && slug in tiers ? tiers[slug as keyof typeof tiers] : null;

  const badges: {
    key: string;
    label: string;
    tone: string;
    icon?: React.ReactNode;
  }[] = [];
  if (tierLabel) {
    badges.push({
      key: "tier",
      label: tierLabel,
      tone: tierTone[slug!] ?? "bg-ro-ink text-ro-canvas",
      icon: slug === "oud-vip" ? <Gem className="size-3" strokeWidth={1.5} /> : undefined,
    });
  }
  if (product.badgeNew) {
    badges.push({
      key: "new",
      label: t.neu,
      tone: "bg-[var(--ro-amber-500)] text-ro-ink",
      icon: <Sparkles className="size-3" strokeWidth={1.5} />,
    });
  }
  if (product.badgeFeatured) {
    badges.push({
      key: "featured",
      label: t.featured,
      tone: "bg-[var(--ro-plum-800)] text-ro-canvas",
      icon: <Star className="size-3" strokeWidth={1.5} />,
    });
  }
  if (showSale) {
    badges.push({
      key: "sale",
      label: percentOff ? `-${percentOff}%` : t.sale,
      tone: "bg-ro-ink text-ro-canvas",
      icon: <Percent className="size-3" strokeWidth={1.5} />,
    });
  }

  if (badges.length === 0) return null;

  return (
    <ul
      className={cn(
        "pointer-events-none absolute start-3 top-3 z-10 flex flex-wrap gap-1.5",
        className
      )}
    >
      {badges.map((b, i) => (
        <m.li
          key={b.key}
          initial={reduce ? false : { opacity: 0, scale: 0.6, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 24,
            delay: reduce ? 0 : i * 0.06,
          }}
          className={cn(
            "flex items-center gap-1 rounded-[var(--ro-r-xs)] px-2 py-1 text-[0.65rem] font-semibold tracking-wide shadow-[0_1px_4px_rgba(0,0,0,0.12)]",
            b.tone
          )}
        >
          {b.icon}
          {b.label}
        </m.li>
      ))}
    </ul>
  );
}
