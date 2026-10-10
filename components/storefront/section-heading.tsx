import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl space-y-4",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-[0.6875rem] tracking-[0.32em] uppercase",
            tone === "dark" ? "text-ro-ivory-muted" : "text-ro-purple"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-display text-3xl leading-[1.15] tracking-wide md:text-4xl lg:text-[2.75rem]",
          tone === "dark" ? "text-ro-ivory" : "text-ro-black"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-base leading-relaxed md:text-lg",
            tone === "dark" ? "text-ro-ivory-muted" : "text-ro-muted"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
