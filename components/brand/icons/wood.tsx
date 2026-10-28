import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

/** Bowl ribs — back wood. */
export function WoodIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M6 8.5c0-2.8 2.7-5 6-5s6 2.2 6 5v7.2c0 2.8-2.7 5-6 5s-6-2.2-6-5V8.5z" />
      <path d="M12 3.5v17" />
      <path d="M8.2 5.8c1.2.9 2.5 1.4 3.8 1.4s2.6-.5 3.8-1.4" />
      <path d="M7.2 9.4c1.5 1.1 3.1 1.7 4.8 1.7s3.3-.6 4.8-1.7" />
      <path d="M6.6 13.2c1.7 1.2 3.5 1.8 5.4 1.8s3.7-.6 5.4-1.8" />
      <path d="M7.4 17c1.4.9 3 1.4 4.6 1.4s3.2-.5 4.6-1.4" />
    </BrandIcon>
  );
}
