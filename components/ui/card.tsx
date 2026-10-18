import Link from "next/link";
import { cn } from "@/lib/utils";

export type CardVariant = "plain" | "inverse" | "media";

type BaseProps = {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
  /** Top media for `media` variant (image / plate). */
  media?: React.ReactNode;
};

type StaticProps = BaseProps & {
  href?: undefined;
  interactive?: false;
};

type LinkProps = BaseProps & {
  href: string;
  /** Storefront interactive card: whole card is one link + hover lift. */
  interactive?: true;
};

/** P07 — plain / inverse / media; interactive = single link + hover lift. */
export function Card(props: StaticProps | LinkProps) {
  const {
    variant = "plain",
    className,
    children,
    media,
  } = props;

  const shell = cn(
    "rounded-[var(--ro-r-sm)] text-ro-ink transition-[box-shadow,transform] duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)]",
    variant === "plain" &&
      "ro-portal-card border border-ro-border bg-ro-paper p-5 md:p-6",
    variant === "inverse" &&
      "ro-inverse border border-ro-line-on-dark bg-[var(--ro-ink-900)] p-5 text-ro-canvas md:p-6",
    variant === "media" &&
      "overflow-hidden border border-ro-border bg-ro-paper",
    className
  );

  const body =
    variant === "media" ? (
      <>
        {media ? (
          <div className="overflow-hidden rounded-t-[var(--ro-r-xs)] [&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:object-cover">
            {media}
          </div>
        ) : null}
        <div className="p-5 md:p-6">{children}</div>
      </>
    ) : (
      children
    );

  if ("href" in props && props.href) {
    return (
      <Link
        href={props.href}
        className={cn(
          shell,
          "block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
          "hover:shadow-[var(--ro-e2)] [@media(hover:hover)]:hover:-translate-y-px"
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={shell}>{body}</div>;
}
