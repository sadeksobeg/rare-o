/** temporary: designer replaces */
import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

export function PickIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M12 20.5 5.5 10.5A6.5 6.5 0 1 1 18.5 10.5Z" />
      <circle cx="12" cy="9.5" r="1.5" />
    </BrandIcon>
  );
}
