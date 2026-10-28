import type { SVGProps, ReactNode } from "react";

/** Large line drawing (96–160px). Colour from `currentColor` only. */
export function BrandIllustration({
  children,
  size = 120,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}
