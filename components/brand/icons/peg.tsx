import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

/** Tuning peg / malwi. */
export function PegIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M12 3.5v9.2" />
      <circle cx="12" cy="16.8" r="3.7" />
      <circle cx="12" cy="16.8" r="1.35" />
      <path d="M7.8 7.2h8.4" />
      <path d="M9.2 5.2h5.6" />
      <path d="M10.4 16.8h3.2M12 15.2v3.2" />
    </BrandIcon>
  );
}
