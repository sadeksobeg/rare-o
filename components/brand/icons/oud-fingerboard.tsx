import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

/** Tapered fingerboard with frets and strings. */
export function OudFingerboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M9.6 3.2h4.8L16 20.8H8L9.6 3.2z" />
      <path d="M9.2 7.2h5.6M8.8 11h6.4M8.5 14.8h7M8.2 18.4h7.6" />
      <path d="M10.6 3.4l-1.2 17.2M13.4 3.4l1.2 17.2" />
      <path d="M11.2 3.3l-.4 17.3M12.8 3.3l.4 17.3" />
    </BrandIcon>
  );
}
