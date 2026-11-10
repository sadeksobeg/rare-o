/** temporary: designer replaces */
import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

export function TunerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M9 8V5.5" />
      <path d="M15 8V5.5" />
      <path d="M12 12v4" />
      <path d="M8 16h8" />
    </BrandIcon>
  );
}
