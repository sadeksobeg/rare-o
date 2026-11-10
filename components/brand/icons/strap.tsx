/** temporary: designer replaces */
import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

export function StrapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M7 5h10" />
      <path d="M8 5c-2 4-2 10 0 14" />
      <path d="M16 5c2 4 2 10 0 14" />
      <path d="M7 19h10" />
      <path d="M10 12h4" />
    </BrandIcon>
  );
}
