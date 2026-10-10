import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  tone = "light",
  className,
}: {
  children: React.ReactNode;
  tone?: "light" | "dark" | "purple";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[0.6875rem] tracking-[0.34em] uppercase",
        tone === "light" && "text-ro-muted",
        tone === "dark" && "text-ro-ivory-muted",
        tone === "purple" && "text-ro-purple",
        className
      )}
    >
      {children}
    </p>
  );
}
