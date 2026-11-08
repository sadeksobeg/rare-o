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

/** Bumped key resets prior dark sessions — light is the product default. */
const STORAGE_KEY = "ro-portal-theme-v5";

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
  defaultTheme = "light",
  className,
  dataPortal,
}: {
  children: ReactNode;
  /** Product default: open light surfaces; user can still switch to dark. */
  defaultTheme?: PortalThemeMode;
  className?: string;
  /** Scopes pilot-only token overrides, e.g. `[data-portal="admin"]`. */
  dataPortal?: string;
}) {
  const [theme, setThemeState] = useState<PortalThemeMode>(defaultTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored();
    /* Honor an explicit stored choice; otherwise seed light default. */
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
        data-portal={dataPortal}
        data-theme-ready={ready ? "true" : "false"}
        /* Theme may flip after mount from localStorage; avoid noisy mismatch. */
        suppressHydrationWarning
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
      theme: "light",
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
  chrome = false,
}: {
  lightLabel: string;
  darkLabel: string;
  className?: string;
  chrome?: boolean;
}) {
  const { theme, toggle } = usePortalTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={cn(
        chrome ? "ro-chrome-icon" : "ro-icon-btn size-11 min-h-11 px-0",
        className
      )}
      aria-label={isDark ? lightLabel : darkLabel}
      aria-pressed={isDark}
      onClick={toggle}
    >
      <span className={chrome ? "ro-chrome-icon-glyph" : undefined}>
        {isDark ? (
          <Sun
            className={chrome ? "size-[1.05rem]" : "size-4"}
            strokeWidth={1.5}
            aria-hidden
          />
        ) : (
          <Moon
            className={chrome ? "size-[1.05rem]" : "size-4"}
            strokeWidth={1.5}
            aria-hidden
          />
        )}
      </span>
    </button>
  );
}
