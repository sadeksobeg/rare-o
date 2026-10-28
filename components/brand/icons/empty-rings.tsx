/** temporary: designer replaces */
import type { SVGProps } from "react";
import { BrandIllustration } from "./_illustration";

export function EmptyRingsIllustration(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  return (
    <BrandIllustration size={120} {...props}>
      <circle cx="80" cy="80" r="70" />
      <circle cx="80" cy="80" r="52" />
      <circle cx="80" cy="80" r="34" />
      <circle cx="80" cy="80" r="16" />
    </BrandIllustration>
  );
}
