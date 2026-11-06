import { slugify } from "@/lib/portfolio";
import type { PortfolioVariant } from "@/lib/portfolio";

export function slugForVariant(
  variants: PortfolioVariant[],
  variant: PortfolioVariant
) {
  const base = basePortfolioSlug(variant.name);
  const index = Math.max(
    0,
    variants.findIndex((candidate) => candidate.id === variant.id)
  );

  const duplicateNumber =
    variants
      .slice(0, index)
      .filter((candidate) => basePortfolioSlug(candidate.name) === base).length + 1;

  if (duplicateNumber === 1) return base;

  const suffix = `-${duplicateNumber}`;
  return `${base.slice(0, 40 - suffix.length)}${suffix}`;
}

function basePortfolioSlug(name: string) {
  const raw = slugify(name);
  const safe = raw.length >= 2 ? raw : `portfolio-${raw}`;
  return safe.slice(0, 40).replace(/-+$/g, "") || "portfolio";
}
