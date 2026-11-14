"use client";

import { useEffect, useState } from "react";
import {
  listDestinationOptions,
  type DestinationOption,
} from "@/lib/shipping/destination-options";

let inflight: Promise<DestinationOption[]> | null = null;
let loaded: DestinationOption[] | null = null;

function load(): Promise<DestinationOption[]> {
  if (loaded) return Promise.resolve(loaded);
  if (!inflight) {
    inflight = fetch("/api/shipping/destinations")
      .then(async (r) => {
        const j = (await r.json()) as { ok: boolean; options?: DestinationOption[] };
        if (!r.ok || !j.ok || !j.options) throw new Error("destinations");
        loaded = j.options;
        return loaded;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Customer surfaces: only destinations with an active rate.
 * `all: true` (admin simulator) keeps the full ISO list.
 */
export function useDestinations(all = false): {
  options: DestinationOption[];
  loading: boolean;
  failed: boolean;
} {
  const [state, setState] = useState<{ options: DestinationOption[]; loading: boolean; failed: boolean }>(
    () => ({
      options: all ? listDestinationOptions() : loaded ?? [],
      loading: !all && !loaded,
      failed: false,
    })
  );
  useEffect(() => {
    if (all) return;
    let cancelled = false;
    load()
      .then((options) => !cancelled && setState({ options, loading: false, failed: false }))
      .catch(() => !cancelled && setState({ options: [], loading: false, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [all]);
  return state;
}
