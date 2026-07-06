import type { Product, ProductVariant } from '@/entities/product';

export type DemoState = 'default' | 'out-of-stock' | 'max';

const SIZE_LABELS: Record<string, string> = {
  xs: 'XS',
  sm: 'S',
  md: 'M',
  lg: 'L',
  xl: 'XL',
  xxl: 'XXL',
};

const SIZE_RANK: Record<string, number> = {
  xs: 0,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
  xxl: 5,
};

export function colorLabel(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function sizeLabel(size: string): string {
  return SIZE_LABELS[size] ?? size.toUpperCase();
}

export function sizesForColor(product: Product, color: string): string[] {
  const sizes = product.variants
    .filter((variant) => variant.color === color)
    .map((variant) => variant.size)
    .filter((size): size is string => size !== null);

  return [...new Set(sizes)].sort((first, second) => {
    const rankFirst = SIZE_RANK[first];
    const rankSecond = SIZE_RANK[second];
    if (rankFirst !== undefined && rankSecond !== undefined)
      return rankFirst - rankSecond;
    const numberFirst = Number(first);
    const numberSecond = Number(second);
    if (!Number.isNaN(numberFirst) && !Number.isNaN(numberSecond)) {
      return numberFirst - numberSecond;
    }
    return first.localeCompare(second);
  });
}

export function imagesForColor(product: Product, color: string): string[] {
  const tagged = product.images
    .filter((image) => image.color === color)
    .map((image) => image.url);
  return tagged.length > 0 ? tagged : product.images.map((image) => image.url);
}

export function colorPreviewImages(product: Product): string[] {
  const firstImages = product.colors
    .map((color) => imagesForColor(product, color)[0])
    .filter((url): url is string => Boolean(url));
  // Dedup: colours without tagged images share the fallback, and the URLs are React keys.
  return [...new Set(firstImages)];
}

export function findVariant(
  product: Product,
  color: string,
  size: string | null,
): ProductVariant | undefined {
  return product.variants.find(
    (variant) => variant.color === color && variant.size === size,
  );
}

export function variantStock(
  product: Product,
  color: string,
  size: string | null,
): number {
  return findVariant(product, color, size)?.stock ?? 0;
}

export function isColorSoldOut(product: Product, color: string): boolean {
  const colorVariants = product.variants.filter(
    (variant) => variant.color === color,
  );
  return (
    colorVariants.length > 0 &&
    colorVariants.every((variant) => variant.stock === 0)
  );
}
