import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

/** Face width across the bowl. */
export function OudSpanWidthIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <ellipse cx="12" cy="12" rx="8.2" ry="6.4" />
      <path d="M5.2 12h13.6" />
      <path d="M5.2 12l2.2-2.2M5.2 12l2.2 2.2" />
      <path d="M18.8 12l-2.2-2.2M18.8 12l-2.2 2.2" />
    </BrandIcon>
  );
}

/** Face / body length. */
export function OudSpanLengthIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <ellipse cx="12" cy="13.2" rx="6.2" ry="7.2" />
      <path d="M12 4.2v15.6" />
      <path d="M12 4.2l-2.1 2.1M12 4.2l2.1 2.1" />
      <path d="M12 19.8l-2.1-2.1M12 19.8l2.1-2.1" />
    </BrandIcon>
  );
}

/** Bowl depth. */
export function OudDepthIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <ellipse cx="12" cy="9.2" rx="7.4" ry="3" />
      <path d="M4.6 9.2v5.4c0 2.1 3.3 3.8 7.4 3.8s7.4-1.7 7.4-3.8V9.2" />
      <path d="M12 6.2v12.2" />
      <path d="M9.6 13.6h4.8" />
      <path d="M8.4 10.8c1.1.5 2.3.8 3.6.8s2.5-.3 3.6-.8" />
    </BrandIcon>
  );
}

/** Neck from pegbox to joint. */
export function OudNeckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M9.4 21c0-2.4 1.4-3.8 1.6-7.2.15-2.6-.2-4.4-.2-7.2V3.6" />
      <path d="M14.6 21c0-2.4-1.4-3.8-1.6-7.2-.15-2.6.2-4.4.2-7.2V3.6" />
      <path d="M8.2 3.6h7.6" />
      <path d="M8.8 6.2h6.4" />
      <circle cx="9.6" cy="5" r="1.15" />
      <circle cx="14.4" cy="5" r="1.15" />
      <path d="M8.4 21h7.2" />
      <path d="M10.2 14.8h3.6" />
    </BrandIcon>
  );
}
