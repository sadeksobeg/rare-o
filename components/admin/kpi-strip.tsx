"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { KpiTile, type KpiTone } from "@/components/admin/kpi-tile";
import type { KpiSeries } from "@/lib/admin/dashboard";
import { portalStagger } from "@/components/motion/presets";
import { cn } from "@/lib/utils";

export type KpiStripItem = {
  id: string;
  label: string;
  value: number;
  href: string;
  idleLabel: string;
  icon?: ReactNode;
  series?: KpiSeries;
  tone: KpiTone;
};

/** Hero waiting total + staggered path KPIs — URL is source of truth for `activeId`. */
export function KpiStrip({
  hero,
  items,
  activeId,
}: {
  hero?: KpiStripItem;
  items: KpiStripItem[];
  activeId?: string | null;
}) {
  const reduce = useReducedMotion();
  const lite = Boolean(reduce);
  const shown = items.slice(0, portalStagger.maxChildren);

  return (
    <div className="ro-admin-kpi-stack">
      {hero ? (
        <div className="ro-admin-kpi-hero">
          <KpiTile
            label={hero.label}
            value={hero.value}
            href={hero.href}
            idleLabel={hero.idleLabel}
            icon={hero.icon}
            series={hero.series}
            tone={hero.tone}
            active={!activeId || activeId === hero.id}
            hero
          />
        </div>
      ) : null}

      <m.div
        className="ro-admin-kpi-strip"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: lite
              ? { staggerChildren: 0 }
              : {
                  staggerChildren: portalStagger.staggerChildren,
                  delayChildren: portalStagger.delayChildren,
                },
          },
        }}
      >
        {shown.map((kpi) => (
          <m.div
            key={kpi.id}
            className={cn("ro-admin-kpi-cell")}
            variants={{
              hidden: lite ? { opacity: 1 } : { opacity: 0, y: 12 },
              show: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: lite ? 0.14 : 0.28,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
          >
            <KpiTile
              label={kpi.label}
              value={kpi.value}
              href={kpi.href}
              idleLabel={kpi.idleLabel}
              icon={kpi.icon}
              series={kpi.series}
              tone={kpi.tone}
              active={activeId === kpi.id}
            />
          </m.div>
        ))}
      </m.div>
    </div>
  );
}
