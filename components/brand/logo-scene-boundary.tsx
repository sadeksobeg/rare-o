"use client";

import { Component, type ReactNode } from "react";

/**
 * A WebGL/R3F render crash must never take down the login shell with it —
 * catch it here and fall back to the static mark.
 */
export class LogoSceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("LogoScene crashed, falling back to the static mark:", error);
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
