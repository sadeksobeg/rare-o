/** temporary: designer replaces */
import type { SVGProps } from "react";
import { BrandIllustration } from "./_illustration";

export function CategoryPlateIllustration(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  return (
    <BrandIllustration size={96} {...props}>
      <rect x="18" y="28" width="124" height="104" rx="8" />
      <circle cx="80" cy="80" r="28" />
      <circle cx="80" cy="80" r="14" />
      <path d="M36 44h28" />
      <path d="M36 52h18" />
    </BrandIllustration>
  );
}
