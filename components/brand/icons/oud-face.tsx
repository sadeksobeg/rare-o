import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

/** Soundboard with carved arabesque rosette. */
export function OudFaceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M12 3.2c4.8 0 8.6 3.5 8.6 8.8S16.8 20.8 12 20.8 3.4 17.3 3.4 12 7.2 3.2 12 3.2z" />
      <circle cx="12" cy="12" r="5.2" />
      <path d="M12 6.8v2.2M12 15v2.2M6.8 12h2.2M15 12h2.2" />
      <path d="M8.4 8.4l1.5 1.5M14.1 8.4l-1.5 1.5M8.4 15.6l1.5-1.5M14.1 15.6l-1.5-1.5" />
      <circle cx="12" cy="12" r="1.6" />
      <path d="M10.6 4.6c.4.9 1.1 1.4 1.4 1.4s1-.5 1.4-1.4" />
    </BrandIcon>
  );
}
