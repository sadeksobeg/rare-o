"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import {
  Handshake,
  Languages,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingBag,
} from "lucide-react";
import { CaseIcon } from "@/components/brand/icons/case";
import { CategoryPlateIllustration } from "@/components/brand/icons/category-plate";
import { CelloIcon } from "@/components/brand/icons/cello";
import { EchoIcon } from "@/components/brand/icons/echo";
import { EmptyRingsIllustration } from "@/components/brand/icons/empty-rings";
import { ErrorGrainIllustration } from "@/components/brand/icons/error-grain";
import { GrainIcon } from "@/components/brand/icons/grain";
import { HandcraftedIcon } from "@/components/brand/icons/handcrafted";
import { OudIcon } from "@/components/brand/icons/oud";
import { PegIcon } from "@/components/brand/icons/peg";
import { PickIcon } from "@/components/brand/icons/pick";
import { QanunIcon } from "@/components/brand/icons/qanun";
import { RosetteIcon } from "@/components/brand/icons/rosette";
import { StrapIcon } from "@/components/brand/icons/strap";
import { StringIcon } from "@/components/brand/icons/string";
import { StringsIcon } from "@/components/brand/icons/strings";
import { TunerIcon } from "@/components/brand/icons/tuner";
import { ViolinIcon } from "@/components/brand/icons/violin";
import { WoodIcon } from "@/components/brand/icons/wood";
import { OudBridgeIcon } from "@/components/brand/icons/oud-bridge";
import { OudFaceIcon } from "@/components/brand/icons/oud-face";
import { OudFingerboardIcon } from "@/components/brand/icons/oud-fingerboard";
import {
  OudDepthIcon,
  OudNeckIcon,
  OudSpanLengthIcon,
  OudSpanWidthIcon,
} from "@/components/brand/icons/oud-span";
import { AnimatedIcon } from "@/components/motion/animated-icon";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";

type Glyph = {
  name: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const BRAND: Glyph[] = [
  { name: "rosette", Icon: RosetteIcon },
  { name: "grain", Icon: GrainIcon },
  { name: "peg", Icon: PegIcon },
  { name: "string", Icon: StringIcon },
  { name: "wood", Icon: WoodIcon },
  { name: "handcrafted", Icon: HandcraftedIcon },
  { name: "echo", Icon: EchoIcon },
];

const OUD_SPECS: Glyph[] = [
  { name: "oud-face", Icon: OudFaceIcon },
  { name: "oud-bridge", Icon: OudBridgeIcon },
  { name: "oud-fingerboard", Icon: OudFingerboardIcon },
  { name: "oud-span-width", Icon: OudSpanWidthIcon },
  { name: "oud-span-length", Icon: OudSpanLengthIcon },
  { name: "oud-depth", Icon: OudDepthIcon },
  { name: "oud-neck", Icon: OudNeckIcon },
];

const INSTRUMENTS: Glyph[] = [
  { name: "oud", Icon: OudIcon },
  { name: "qanun", Icon: QanunIcon },
  { name: "violin", Icon: ViolinIcon },
  { name: "cello", Icon: CelloIcon },
  { name: "case", Icon: CaseIcon },
  { name: "strap", Icon: StrapIcon },
  { name: "pick", Icon: PickIcon },
  { name: "tuner", Icon: TunerIcon },
  { name: "strings", Icon: StringsIcon },
];

const LUCIDE_NAV: Glyph[] = [
  { name: "dashboard", Icon: LayoutDashboard },
  { name: "inbox", Icon: MessageSquare },
  { name: "requests", Icon: ShoppingBag },
  { name: "deals", Icon: Handshake },
  { name: "wholesale", Icon: Package },
  { name: "language", Icon: Languages },
];

export function IconGallery({ locale }: { locale: "ar" | "en" }) {
  const [pulse, setPulse] = useState(0);
  const ar = locale === "ar";

  return (
    <div id="icons" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ro-text-2">
          {ar
            ? "خط 1.5، أحجام 16/20/24، currentColor. المجموعة المؤقتة قابلة لاستبدال الملف."
            : "Stroke 1.5, sizes 16/20/24, currentColor. Temporary set — designer file swap."}
        </p>
        <button
          type="button"
          className="rounded-[var(--ro-r-sm)] border border-ro-border px-3 py-1.5 text-xs font-semibold"
          onClick={() => setPulse((n) => n + 1)}
        >
          {ar ? "نبضة" : "Pulse"}
        </button>
      </div>

      <IconRow title={ar ? "رموز العلامة" : "Brand glyphs"} items={BRAND} pulseKey={pulse} />
      <IconRow
        title={ar ? "مواصفات العود" : "Oud specs"}
        items={OUD_SPECS}
        pulseKey={pulse}
      />
      <IconRow
        title={ar ? "آلات (مؤقت)" : "Instruments (temporary)"}
        items={INSTRUMENTS}
        pulseKey={pulse}
      />
      <IconRow
        title={ar ? "تنقل lucide" : "Lucide navigation"}
        items={LUCIDE_NAV}
        pulseKey={pulse}
      />

      <section className="space-y-3">
        <h3 className="ro-type-overline">
          {ar ? "رسوم 96–160" : "Illustrations 96–160"}
        </h3>
        <div className="flex flex-wrap items-end gap-8 text-[var(--ro-plum-900)]">
          <figure className="space-y-2 text-center">
            <AnimatedIcon pulseKey={pulse}>
              <EmptyRingsIllustration />
            </AnimatedIcon>
            <figcaption className="text-xs text-ro-muted">empty-rings</figcaption>
          </figure>
          <figure className="space-y-2 text-center">
            <AnimatedIcon pulseKey={pulse}>
              <CategoryPlateIllustration />
            </AnimatedIcon>
            <figcaption className="text-xs text-ro-muted">category-plate</figcaption>
          </figure>
          <figure className="space-y-2 text-center">
            <AnimatedIcon pulseKey={pulse}>
              <ErrorGrainIllustration />
            </AnimatedIcon>
            <figcaption className="text-xs text-ro-muted">error-grain</figcaption>
          </figure>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="ro-type-overline">
          {ar ? "شرائح الحالة" : "Status chips"}
        </h3>
        <div className="flex flex-wrap gap-2">
          <StatusChip tone="info" label="submitted" />
          <StatusChip tone="progress" label="open" />
          <StatusChip tone="attention" label="waiting" />
          <StatusChip tone="success" label="accepted" />
          <StatusChip tone="danger" label="failed" />
          <StatusChip tone="closed" label="closed" />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="ro-type-overline">
          {ar ? "حالة فارغة" : "Empty state"}
        </h3>
        <EmptyState
          title={ar ? "لا نتائج" : "No results"}
          body={ar ? "جرّب مسح الفلاتر." : "Try clearing filters."}
          actionHref="/catalog"
          actionLabel={ar ? "الكتالوج" : "Catalog"}
        />
      </section>
    </div>
  );
}

function IconRow({
  title,
  items,
  pulseKey,
}: {
  title: string;
  items: Glyph[];
  pulseKey: number;
}) {
  return (
    <section className="space-y-3">
      <h3 className="ro-type-overline">{title}</h3>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7">
        {items.map(({ name, Icon }) => (
          <li
            key={name}
            className="flex flex-col items-center gap-2 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper px-2 py-4 text-[var(--ro-plum-900)]"
          >
            <div className="flex items-center gap-2">
              <AnimatedIcon pulseKey={pulseKey}>
                <Icon className="size-4" strokeWidth={1.5} />
              </AnimatedIcon>
              <AnimatedIcon pulseKey={pulseKey}>
                <Icon className="size-5" strokeWidth={1.5} />
              </AnimatedIcon>
              <AnimatedIcon pulseKey={pulseKey}>
                <Icon className="size-6" strokeWidth={1.5} />
              </AnimatedIcon>
            </div>
            <span className="text-[10px] text-ro-muted">{name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
