"use client";

import type { CSSProperties } from "react";
import { OudSpecIconMark } from "@/components/catalog/oud-spec-icon";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import {
  collectOudSpecItems,
  parseOudSpecs,
  type OudSpecGroup,
  type OudSpecIconKey,
  type OudSpecs,
} from "@/lib/catalog/oud-specs";
import { cn } from "@/lib/utils";

const GROUP_ORDER: OudSpecGroup[] = ["wood", "measures", "details"];

const GROUP_ICON: Record<OudSpecGroup, OudSpecIconKey> = {
  wood: "back",
  measures: "faceWidth",
  details: "finish",
};

function groupTitle(
  group: OudSpecGroup,
  copy: Dictionary["product"]["oudSpecs"]
): string {
  if (group === "wood") return copy.wood;
  if (group === "measures") return copy.measures;
  return copy.details;
}

function itemLabel(
  key: OudSpecIconKey,
  copy: Dictionary["product"]["oudSpecs"]
): string {
  return copy[key];
}

export function OudSpecGallery({
  specs,
  locale,
  dict,
  className,
}: {
  specs: unknown;
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  const copy = dict.product.oudSpecs;
  const parsed: OudSpecs | null = parseOudSpecs(specs);
  const items = collectOudSpecItems(
    parsed,
    locale,
    copy.mm,
    copy.standardNeckYes,
    copy.standardNeckNo
  );
  if (items.length === 0) return null;

  return (
    <section className={cn("space-y-6", className)}>
      <h2 className="ro-type-h2">{copy.title}</h2>
      {GROUP_ORDER.map((group) => {
        const rows = items.filter((item) => item.group === group);
        if (rows.length === 0) return null;
        return (
          <div key={group} className="space-y-3">
            <h3 className="flex items-center gap-2.5 ro-type-overline text-ro-plum">
              <OudSpecIconMark iconKey={GROUP_ICON[group]} size="sm" />
              {groupTitle(group, copy)}
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {rows.map((item, index) => (
                <li
                  key={item.key}
                  className="ro-oud-spec-tile"
                  style={{ "--ro-oud-spec-i": index } as CSSProperties}
                >
                  <OudSpecIconMark iconKey={item.key} size="md" />
                  <p className="text-xs font-medium tracking-wide text-ro-muted">
                    {itemLabel(item.key, copy)}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-ro-ink">
                    {item.value}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
