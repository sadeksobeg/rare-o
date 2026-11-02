"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type PortalThemeMode = "dark" | "light";

/** Bumped key resets prior light sessions so VISION dark-luxury is first paint. */
const STORAGE_KEY = "ro-portal-theme-v3";

type PortalThemeContextValue = {
  theme: PortalThemeMode;
  setTheme: (next: PortalThemeMode) => void;
  toggle: () => void;
};

const PortalThemeContext = createContext<PortalThemeContextValue | null>(null);

function readStored(): PortalThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function PortalThemeProvider({
  children,
  defaultTheme = "dark",
  className,
}: {
  children: ReactNode;
  /** VISION: dark-luxury first for admin/trader. */
  defaultTheme?: PortalThemeMode;
  className?: string;
}) {
  const [theme, setThemeState] = useState<PortalThemeMode>(defaultTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored();
    /* VISION: dark-luxury first. Only honor an explicit stored choice. */
    if (stored) setThemeState(stored);
    else {
      try {
        window.localStorage.setItem(STORAGE_KEY, defaultTheme);
      } catch {
        /* ignore */
      }
    }
    setReady(true);
  }, [defaultTheme]);

  const setTheme = useCallback((next: PortalThemeMode) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle]
  );

  return (
    <PortalThemeContext.Provider value={value}>
      <div
        className={className}
        data-theme={theme}
        data-theme-ready={ready ? "true" : "false"}
      >
        {children}
      </div>
    </PortalThemeContext.Provider>
  );
}

export function usePortalTheme(): PortalThemeContextValue {
  const ctx = useContext(PortalThemeContext);
  if (!ctx) {
    return {
      theme: "dark",
      setTheme: () => undefined,
      toggle: () => undefined,
    };
  }
  return ctx;
}

/** Compact sun/moon toggle for portal chrome (VISION icon header). */
export function PortalThemeToggle({
  lightLabel,
  darkLabel,
  className,
}: {
  lightLabel: string;
  darkLabel: string;
  className?: string;
}) {
  const { theme, toggle } = usePortalTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={cn("ro-icon-btn size-11 min-h-11 px-0", className)}
      aria-label={isDark ? lightLabel : darkLabel}
      aria-pressed={isDark}
      onClick={toggle}
    >
      {isDark ? (
        <Sun className="size-4" strokeWidth={1.5} aria-hidden />
      ) : (
        <Moon className="size-4" strokeWidth={1.5} aria-hidden />
      )}
    </button>
  );
}
