"use client";

import { useCallback, useEffect, useState } from "react";
import { AMBIENT_MAX_MS } from "./resolve-tier";
import { useMotion } from "./context";

/** Ambient loops (hero rings) run at most 5s, then pause until a user gesture. */
export function useAmbientMotion(maxMs: number = AMBIENT_MAX_MS) {
  const { lite } = useMotion();
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (lite) {
      setActive(false);
      return;
    }
    setActive(true);
    const t = window.setTimeout(() => setActive(false), maxMs);
    return () => window.clearTimeout(t);
  }, [lite, maxMs]);

  const resume = useCallback(() => {
    if (lite) return;
    setActive(true);
    window.setTimeout(() => setActive(false), maxMs);
  }, [lite, maxMs]);

  return { active: lite ? false : active, resume };
}
