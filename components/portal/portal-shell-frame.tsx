"use client";

import type { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/provider";
import {
  PortalThemeProvider,
  type PortalThemeMode,
} from "@/components/portal/portal-theme";
import type { MotionSurface } from "@/components/motion/resolve-tier";

/** Client frame: dark-luxury theme + motion tier for admin/trader shells. */
export function PortalShellFrame({
  children,
  surface,
  className,
  defaultTheme = "dark",
}: {
  children: ReactNode;
  surface: MotionSurface;
  className: string;
  defaultTheme?: PortalThemeMode;
}) {
  return (
    <PortalThemeProvider defaultTheme={defaultTheme} className={className}>
      <MotionProvider surface={surface}>{children}</MotionProvider>
    </PortalThemeProvider>
  );
}
