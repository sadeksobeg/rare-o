/** temporary: designer replaces */
import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

export function EchoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M7.5 7.5a6.5 6.5 0 0 0 0 9" />
      <path d="M16.5 7.5a6.5 6.5 0 0 1 0 9" />
      <path d="M5 5a10 10 0 0 0 0 14" />
      <path d="M19 5a10 10 0 0 1 0 14" />
    </BrandIcon>
  );
}
