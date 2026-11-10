import type { SVGProps } from "react";
import { BrandIcon } from "./_base";

/** Handcrafted / standard neck craft mark. */
export function HandcraftedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M8.2 13.2V8.4a1.6 1.6 0 0 1 3.2 0V12.2" />
      <path d="M11.4 12.2V7.6a1.6 1.6 0 0 1 3.2 0V12.2" />
      <path d="M14.6 12.2V8.6a1.6 1.6 0 0 1 3.2 0V14.4c0 3.1-2.1 5.1-5.1 5.1h-1.2c-3.1 0-5.1-2.3-5.1-5.4v-3.2" />
      <path d="M7.2 11.2c-.9.4-1.5 1.2-1.5 2.3 0 1.5 1.1 2.5 2.5 2.5" />
    </BrandIcon>
  );
}
