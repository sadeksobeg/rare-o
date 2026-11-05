"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TextField } from "@/components/ui/text-field";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
} from "@/lib/ui/form-classes";

export type SuggestEnLabels = {
  translateSuggest: string;
  translatePending: string;
  translateFailed: string;
};

type SuggestResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

async function fetchSuggestEnglish(text: string): Promise<SuggestResult> {
  const res = await fetch("/api/admin/suggest-en", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ text }),
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, error: "UPSTREAM" };
  const data = (await res.json()) as SuggestResult;
  if (!data || typeof data !== "object" || !("ok" in data)) {
    return { ok: false, error: "UPSTREAM" };
  }
  return data;
}

/** Shared AR→EN draft suggestion (debounce + manual button). */
export function useSuggestEnglish(labels: SuggestEnLabels) {
  const [error, setError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const seq = useRef(0);

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  function runSuggest(
    source: string,
    apply: (text: string) => void,
    alreadyTouched: boolean
  ) {
    const q = source.trim();
    if (!q || alreadyTouched) return;
    const ticket = ++seq.current;
    setSuggesting(true);
    setError(null);
    void fetchSuggestEnglish(q)
      .then((res) => {
        if (ticket !== seq.current) return;
        if (!res.ok) {
          setError(labels.translateFailed);
          return;
        }
        apply(res.text);
      })
      .catch(() => {
        if (ticket !== seq.current) return;
        setError(labels.translateFailed);
      })
      .finally(() => {
        if (ticket === seq.current) setSuggesting(false);
      });
  }

  function scheduleSuggest(
    key: string,
    source: string,
    apply: (text: string) => void,
    alreadyTouched: boolean,
    delayMs: number
  ) {
    const prev = timers.current.get(key);
    if (prev) clearTimeout(prev);
    timers.current.set(
      key,
      setTimeout(() => {
        timers.current.delete(key);
        runSuggest(source, apply, alreadyTouched);
      }, delayMs)
    );
  }

  return { suggesting, error, setError, runSuggest, scheduleSuggest };
}

export function SuggestEnButton({
  labels,
  suggesting,
  disabled,
  onClick,
}: {
  labels: SuggestEnLabels;
  suggesting: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="text-xs font-medium text-[color:var(--ro-accent-fg,var(--ro-plum-700))] underline-offset-2 hover:underline disabled:opacity-50"
      disabled={suggesting || disabled}
      onClick={onClick}
    >
      {suggesting ? labels.translatePending : labels.translateSuggest}
    </button>
  );
}

type PairLabels = SuggestEnLabels & {
  /** Optional shared error slot — parent can render once. */
};

/** Uncontrolled AR/EN text inputs with auto-suggest into EN when empty/untouched. */
export function SuggestEnTextPair({
  arName,
  enName,
  arLabel,
  enLabel,
  arDefault = "",
  enDefault = "",
  labels,
  dense,
  delayMs = 900,
  className,
  leading,
}: {
  arName: string;
  enName: string;
  arLabel: string;
  enLabel: string;
  arDefault?: string;
  enDefault?: string;
  labels: PairLabels;
  dense?: boolean;
  delayMs?: number;
  className?: string;
  leading?: ReactNode;
}) {
  const { suggesting, error, runSuggest, scheduleSuggest } =
    useSuggestEnglish(labels);
  const [ar, setAr] = useState(arDefault);
  const [en, setEn] = useState(enDefault);
  const [enTouched, setEnTouched] = useState(Boolean(enDefault.trim()));

  const fields = (
    <div className={className ?? "grid gap-3 sm:grid-cols-2"}>
      <TextField
        name={arName}
        label={arLabel}
        value={ar}
        onChange={(e) => {
          const v = e.target.value;
          setAr(v);
          scheduleSuggest(
            arName,
            v,
            (t) => {
              setEn(t);
            },
            enTouched,
            delayMs
          );
        }}
        dir="rtl"
        dense={dense}
      />
      <div className="space-y-1.5">
        <TextField
          name={enName}
          label={enLabel}
          value={en}
          onChange={(e) => {
            setEnTouched(true);
            setEn(e.target.value);
          }}
          dir="ltr"
          dense={dense}
        />
        <SuggestEnButton
          labels={labels}
          suggesting={suggesting}
          disabled={!ar.trim()}
          onClick={() => {
            setEnTouched(false);
            runSuggest(
              ar,
              (t) => {
                setEn(t);
                setEnTouched(false);
              },
              false
            );
          }}
        />
        {error ? (
          <p
            role="alert"
            className="text-xs text-[color:var(--ro-danger,#e07070)]"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (!leading) return fields;
  return (
    <>
      {leading}
      {fields}
    </>
  );
}

/** Uncontrolled AR/EN textareas with the same suggest behaviour. */
export function SuggestEnTextAreaPair({
  arName,
  enName,
  arLabel,
  enLabel,
  arDefault = "",
  enDefault = "",
  labels,
  delayMs = 1100,
  arHelper,
}: {
  arName: string;
  enName: string;
  arLabel: string;
  enLabel: string;
  arDefault?: string;
  enDefault?: string;
  labels: SuggestEnLabels;
  delayMs?: number;
  arHelper?: string;
}) {
  const { suggesting, error, runSuggest, scheduleSuggest } =
    useSuggestEnglish(labels);
  const [ar, setAr] = useState(arDefault);
  const [en, setEn] = useState(enDefault);
  const [enTouched, setEnTouched] = useState(Boolean(enDefault.trim()));

  return (
    <div className="space-y-3">
      <label className={controlLabelClass}>
        <span className={controlLabelTextClass}>{arLabel}</span>
        <textarea
          name={arName}
          rows={3}
          dir="rtl"
          value={ar}
          onChange={(e) => {
            const v = e.target.value;
            setAr(v);
            scheduleSuggest(
              arName,
              v,
              (t) => {
                setEn(t);
              },
              enTouched,
              delayMs
            );
          }}
          className={controlClass}
        />
      </label>
      {arHelper ? (
        <p className="-mt-2 text-xs text-ro-muted">{arHelper}</p>
      ) : null}
      <div className="space-y-1.5">
        <label className={controlLabelClass}>
          <span className={controlLabelTextClass}>{enLabel}</span>
          <textarea
            name={enName}
            rows={3}
            dir="ltr"
            value={en}
            onChange={(e) => {
              setEnTouched(true);
              setEn(e.target.value);
            }}
            className={controlClass}
          />
        </label>
        <SuggestEnButton
          labels={labels}
          suggesting={suggesting}
          disabled={!ar.trim()}
          onClick={() => {
            setEnTouched(false);
            runSuggest(
              ar,
              (t) => {
                setEn(t);
                setEnTouched(false);
              },
              false
            );
          }}
        />
        {error ? (
          <p
            role="alert"
            className="text-xs text-[color:var(--ro-danger,#e07070)]"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Compact alt-text pair for media uploader (plain inputs). */
export function SuggestEnAltPair({
  arName = "altAr",
  enName = "altEn",
  arLabel,
  enLabel,
  arDefault = "",
  enDefault = "",
  labels,
}: {
  arName?: string;
  enName?: string;
  arLabel: string;
  enLabel: string;
  arDefault?: string;
  enDefault?: string;
  labels: SuggestEnLabels;
}) {
  const { suggesting, error, runSuggest, scheduleSuggest } =
    useSuggestEnglish(labels);
  const [ar, setAr] = useState(arDefault);
  const [en, setEn] = useState(enDefault);
  const [enTouched, setEnTouched] = useState(Boolean(enDefault.trim()));

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block space-y-1 text-xs">
          <span>{arLabel}</span>
          <input
            name={arName}
            value={ar}
            onChange={(e) => {
              const v = e.target.value;
              setAr(v);
              scheduleSuggest(
                arName,
                v,
                (t) => {
                  setEn(t);
                },
                enTouched,
                900
              );
            }}
            dir="rtl"
            className="w-full border border-ro-line bg-transparent px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block space-y-1 text-xs">
          <span>{enLabel}</span>
          <input
            name={enName}
            value={en}
            onChange={(e) => {
              setEnTouched(true);
              setEn(e.target.value);
            }}
            dir="ltr"
            className="w-full border border-ro-line bg-transparent px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SuggestEnButton
          labels={labels}
          suggesting={suggesting}
          disabled={!ar.trim()}
          onClick={() => {
            setEnTouched(false);
            runSuggest(
              ar,
              (t) => {
                setEn(t);
                setEnTouched(false);
              },
              false
            );
          }}
        />
        {error ? (
          <p
            role="alert"
            className="text-xs text-[color:var(--ro-danger,#e07070)]"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
