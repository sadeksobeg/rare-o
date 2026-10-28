import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

/** Bridge block with string hitch pins. */
export function OudBridgeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M5 14.2h14v4.2H5z" />
      <path d="M6.4 14.2V11M9.2 14.2V10.2M12 14.2V9.6M14.8 14.2V10.2M17.6 14.2V11" />
      <circle cx="6.4" cy="18.4" r="0.9" />
      <circle cx="9.2" cy="18.4" r="0.9" />
      <circle cx="12" cy="18.4" r="0.9" />
      <circle cx="14.8" cy="18.4" r="0.9" />
      <circle cx="17.6" cy="18.4" r="0.9" />
      <path d="M7.2 6.2c1.4-1.6 3-2.4 4.8-2.4s3.4.8 4.8 2.4" />
      <path d="M8.4 9c1-.9 2.2-1.4 3.6-1.4s2.6.5 3.6 1.4" />
    </BrandIcon>
  );
}
