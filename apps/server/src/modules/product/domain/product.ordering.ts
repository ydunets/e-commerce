import { compareSizes } from '@e-commerce/contracts';
import type { ProductVariant } from '#src/modules/product/domain/product.types.ts';

// Distinct colours ordered by where their first image appears (image ids are
// seeded in source order), so the product's primary colour comes first.
export function orderedColors(
  inventory: { color: string }[],
  images: { color: string }[],
): string[] {
  const imageOrder = new Map<string, number>();
  for (const image of images) {
    if (!imageOrder.has(image.color)) imageOrder.set(image.color, imageOrder.size);
  }
  const rank = (color: string) => imageOrder.get(color) ?? Number.MAX_SAFE_INTEGER;
  const colors = [...new Set(inventory.map((row) => row.color))];
  return colors.sort((first, second) => rank(first) - rank(second) || first.localeCompare(second));
}

export function byColorThenSize(colors: string[]) {
  const colorRank = (color: string) => {
    const index = colors.indexOf(color);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return (first: ProductVariant, second: ProductVariant) =>
    colorRank(first.color) - colorRank(second.color) ||
    compareSizes(first.size ?? '', second.size ?? '');
}

export function distinctSizes(variants: ProductVariant[]): string[] {
  return [...new Set(variants.map((variant) => variant.size))]
    .filter((size): size is string => size !== null)
    .sort(compareSizes);
}
