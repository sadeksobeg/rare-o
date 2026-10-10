import Image from "next/image";
import { cn } from "@/lib/utils";

type Variant = "master" | "small";

const SRC: Record<Variant, string> = {
  master: "/brand/mark-master.png",
  small: "/brand/mark-small.png",
};

export function Emblem({
  variant = "master",
  className,
  alt = "RARE OUD",
  priority = false,
}: {
  variant?: Variant;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  const size = variant === "small" ? 32 : 72;
  return (
    <Image
      src={SRC[variant]}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}
