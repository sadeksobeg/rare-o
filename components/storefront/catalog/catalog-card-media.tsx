"use client";

import { ProductThumb } from "@/components/storefront/product-media";
import { CatalogCardHoverImage } from "@/components/storefront/catalog/catalog-card-hover-image";
import { cn } from "@/lib/utils";

export function CatalogCardMedia({
  primaryPath,
  primaryKind,
  primaryAlt,
  secondaryPath,
  secondaryAlt,
  plateCaption,
  dimmed,
}: {
  primaryPath?: string | null;
  primaryKind?: string;
  primaryAlt: string;
  secondaryPath?: string | null;
  secondaryAlt?: string;
  plateCaption: string;
  dimmed?: boolean;
}) {
  return (
    <div className="group/image relative aspect-[4/5] w-full">
      <ProductThumb
        path={primaryPath}
        alt={primaryAlt}
        kind={primaryKind}
        plateCaption={plateCaption}
        className={cn(dimmed && "opacity-80", "h-full w-full")}
      />
      {secondaryPath ? (
        <CatalogCardHoverImage path={secondaryPath} alt={secondaryAlt ?? primaryAlt} />
      ) : null}
    </div>
  );
}
