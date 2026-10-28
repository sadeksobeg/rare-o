/** temporary: designer replaces */
import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

export function CaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <rect x="3.5" y="8" width="17" height="11" rx="2" />
      <path d="M8 8V6.5A2.5 2.5 0 0 1 10.5 4h3A2.5 2.5 0 0 1 16 6.5V8" />
      <path d="M3.5 13h17" />
    </BrandIcon>
  );
}
