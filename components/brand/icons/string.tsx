import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

/** Vibrating course / string length. */
export function StringIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M3.5 7.5h17" />
      <path d="M3.5 12c2.8-2.4 5.6 2.4 8.5 0s5.7-2.4 8.5 0" />
      <path d="M3.5 16.5h17" />
      <circle cx="5" cy="7.5" r="1" />
      <circle cx="19" cy="7.5" r="1" />
      <circle cx="5" cy="16.5" r="1" />
      <circle cx="19" cy="16.5" r="1" />
    </BrandIcon>
  );
}
