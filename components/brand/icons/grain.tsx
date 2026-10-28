import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

/** Finish / wood grain sheen. */
export function GrainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />
      <path d="M6.5 8.2c3.2 1.4 7.8-1.2 11 0" />
      <path d="M6.5 12c3.5 1.6 7.5-1.4 11 0" />
      <path d="M6.5 15.8c3.2 1.4 7.8-1.2 11 0" />
      <path d="M9 5.2v13.6" />
    </BrandIcon>
  );
}
