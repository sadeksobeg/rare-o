"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { PressRipple } from "@/components/motion/press-ripple";
import { cn } from "@/lib/utils";

/** Portal card/row link with S1 press ripple. */
export function PressLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <PressRipple>
      <Link href={href} className={cn(className)} {...rest}>
        {children}
      </Link>
    </PressRipple>
  );
}
