"use client";

import { useRef, useState } from "react";
import {
  CountUp,
  DrawIn,
  MotionProvider,
  PressRipple,
  RosetteMark,
  Stagger,
  StringLine,
  TiltSurface,
  flyToTarget,
  useMotion,
  useScrollSpy,
  type MotionTier,
} from "@/components/motion";

type Copy = {
  locale: "ar" | "en";
  title: string;
  lead: string;
  tier: string;
  reduce: string;
  auto: string;
  sampler: string;
  add: string;
  list: string;
  pieces: string;
  replay: string;
  ripple: string;
  strings: string;
  tilt: string;
  reveal: string;
  spy: string;
  spyA: string;
  spyB: string;
  spyC: string;
};

function Controls({ copy }: { copy: Copy }) {
  const { tier, setOverride, override } = useMotion();
  const tiers: Array<MotionTier | "auto"> = ["auto", "A", "B", "C", "Lite"];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs text-ro-muted">
        {copy.tier}: {tier}
      </span>
      {tiers.map((t) => (
        <button
          key={t}
          type="button"
          className="rounded-[var(--ro-r-sm)] border border-ro-border px-2 py-1 text-xs data-[on=true]:border-ro-plum data-[on=true]:text-ro-plum"
          data-on={t === "auto" ? override === null : override === t}
          onClick={() => setOverride(t === "auto" ? null : t)}
        >
          {t === "auto" ? copy.auto : t}
        </button>
      ))}
      <label className="ms-auto flex items-center gap-2 text-xs text-ro-muted">
        <input
          type="checkbox"
          checked={override === "Lite"}
          onChange={(e) => setOverride(e.target.checked ? "Lite" : null)}
        />
        {copy.reduce}
      </label>
    </div>
  );
}

function Sampler({ copy }: { copy: Copy }) {
  const { lite } = useMotion();
  const addRef = useRef<HTMLButtonElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [kpiKey, setKpiKey] = useState(0);

  async function add() {
    const next = count + 1;
    if (lite) {
      setCount(next);
      return;
    }
    if (addRef.current && badgeRef.current) {
      await flyToTarget(addRef.current, badgeRef.current, {
        lite,
        onArrive: () => setCount(next),
      });
    } else {
      setCount(next);
    }
  }

  return (
    <div
      className="ro-inverse space-y-6 rounded-[var(--ro-r-md)] bg-ro-ink p-5 text-[var(--ro-sand-100)]"
      data-testid="motion-sampler"
    >
      <p className="text-xs opacity-70">{copy.sampler}</p>
      <div className="grid items-center gap-6 md:grid-cols-2">
        <PressRipple className="mx-auto w-fit rounded-full">
          <DrawIn>
            <RosetteMark className="cursor-pointer" />
          </DrawIn>
        </PressRipple>
        <div className="space-y-1">
          <StringLine label={copy.strings} />
          <StringLine label={copy.strings} />
          <StringLine label={copy.strings} />
          <StringLine label={copy.strings} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-[color-mix(in_srgb,var(--ro-sand-100)_16%,transparent)] pt-4">
        <PressRipple className="rounded-[var(--ro-r-sm)]">
          <button
            ref={addRef}
            type="button"
            className="rounded-[var(--ro-r-sm)] bg-[var(--ro-sand-100)] px-5 py-2.5 text-sm font-medium text-ro-ink"
            onClick={add}
          >
            {copy.add}
          </button>
        </PressRipple>
        <span
          ref={badgeRef}
          className="rounded-[var(--ro-r-sm)] bg-[var(--ro-plum-900)] px-3 py-1.5 text-sm"
          data-testid="motion-badge"
        >
          {copy.list}: <b>{count}</b>
        </span>
        <span className="ms-auto text-sm">
          {copy.pieces}{" "}
          <CountUp key={kpiKey} value={128} className="text-xl" />
        </span>
        <button
          type="button"
          className="text-sm underline-offset-4 hover:underline"
          onClick={() => {
            setCount(0);
            setKpiKey((k) => k + 1);
          }}
        >
          {copy.replay}
        </button>
      </div>
    </div>
  );
}

function SpyDemo({ copy }: { copy: Copy }) {
  const ids = ["motion-spy-a", "motion-spy-b", "motion-spy-c"];
  const active = useScrollSpy(ids);
  const labels = [copy.spyA, copy.spyB, copy.spyC];
  return (
    <div className="grid gap-4 md:grid-cols-[10rem_1fr]">
      <ol className="space-y-1 text-sm">
        {ids.map((id, i) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={active === id ? "text-ro-plum" : "text-ro-muted"}
            >
              {labels[i]}
            </a>
          </li>
        ))}
      </ol>
      <div className="max-h-40 space-y-6 overflow-y-auto rounded-[var(--ro-r-sm)] border border-ro-border p-4 text-sm">
        {ids.map((id, i) => (
          <section key={id} id={id}>
            <h4 className="font-medium">{labels[i]}</h4>
            <p className="text-ro-text-2">{copy.spy}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export function MotionGallery({ copy }: { copy: Copy }) {
  return (
    <MotionProvider>
      <div className="space-y-8" id="motion-lab">
        <Controls copy={copy} />
        <Sampler copy={copy} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stagger className="contents">
            <p className="rounded-[var(--ro-r-sm)] border border-ro-border p-4 text-sm">
              {copy.reveal} 1
            </p>
            <p className="rounded-[var(--ro-r-sm)] border border-ro-border p-4 text-sm">
              {copy.reveal} 2
            </p>
            <p className="rounded-[var(--ro-r-sm)] border border-ro-border p-4 text-sm">
              {copy.reveal} 3
            </p>
          </Stagger>
        </div>
        <TiltSurface className="rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper p-6">
          <p className="text-sm">{copy.tilt}</p>
        </TiltSurface>
        <SpyDemo copy={copy} />
      </div>
    </MotionProvider>
  );
}
