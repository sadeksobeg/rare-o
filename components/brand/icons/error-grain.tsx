/** temporary: designer replaces */
import type { SVGProps } from "react";
import { BrandIllustration } from "./_illustration";

export function ErrorGrainIllustration(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  return (
    <BrandIllustration size={160} {...props}>
      <circle cx="80" cy="80" r="70" />
      <path d="M28 48c28 14 56-14 104 0" />
      <path d="M24 80c32 16 64-16 112 0" />
      <path d="M28 112c28 14 60-14 104 0" />
      <path d="M58 58 102 102" />
      <path d="M102 58 58 102" />
    </BrandIllustration>
  );
}
