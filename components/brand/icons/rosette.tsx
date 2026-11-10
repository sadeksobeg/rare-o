/** temporary: designer replaces */
import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

export function RosetteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" />
    </BrandIcon>
  );
}
