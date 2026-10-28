/** temporary: designer replaces */
import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

export function OudIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <ellipse cx="12" cy="15" rx="7" ry="6" />
      <path d="M12 9.5V4.5" />
      <path d="M9.5 4.5h5" />
      <path d="M10 3.5v2" />
      <path d="M12 3.5v2" />
      <path d="M14 3.5v2" />
      <circle cx="12" cy="15" r="2" />
    </BrandIcon>
  );
}
