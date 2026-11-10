import Image from "next/image";
import { cn } from "@/lib/utils";

type Block = {
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
};

/** Editorial “A+” modules under the fold — image + copy, no invented product claims. */
export function ProductAPlus({
  heading,
  blocks,
  className,
}: {
  heading: string;
  blocks: Block[];
  className?: string;
}) {
  if (blocks.length === 0) return null;
  return (
    <section className={cn("space-y-8", className)}>
      <h2 className="ro-type-h2">{heading}</h2>
      <div className="space-y-10">
        {blocks.map((block, i) => (
          <article
            key={block.title}
            className={cn(
              "grid items-center gap-6 md:grid-cols-2 md:gap-10",
              i % 2 === 1 && "md:[&>*:first-child]:order-2"
            )}
          >
            <div className="relative aspect-[16/11] overflow-hidden rounded-[var(--ro-r-md)] bg-ro-sunken">
              <Image
                src={block.imageSrc}
                alt={block.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="space-y-3">
              <h3 className="font-display text-2xl font-semibold text-ro-ink">
                {block.title}
              </h3>
              <p className="leading-relaxed text-ro-text-2">{block.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
