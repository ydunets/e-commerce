import { useState } from 'react';
import type { Product } from '@/entities/product';
import {
  colorLabel,
  findVariant,
  imagesForColor,
  isColorSoldOut,
  sizeLabel,
  sizesForColor,
  variantStock,
} from './product-display';

// At least 1 so the stepper never shows 0 for an in-stock size, at most the
// stock on hand (which keeps a floor of 1 for the sold-out case).
const clampQuantity = (quantity: number, stock: number) =>
  Math.min(Math.max(quantity, 1), Math.max(stock, 1));

export function useProductSelection(product: Product) {
  const colors = product.colors;

  // Initial selection is stock-agnostic and can land on a sold-out size, unlike `selectColor`.
  const initialColor = colors[0] ?? '';
  const initialSize = sizesForColor(product, initialColor)[0] ?? null;

  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize);
  const [quantity, setQuantity] = useState(1);

  const currentVariant = findVariant(product, selectedColor, selectedSize);
  const isOutOfStock = (currentVariant?.stock ?? 0) === 0;
  const maxStock = currentVariant?.stock ?? 0;
  const displayedQuantity = isOutOfStock ? 0 : quantity;

  const colorOptions = colors.map((color) => ({
    value: color,
    label: colorLabel(color),
    disabled: isColorSoldOut(product, color),
  }));

  const sizeOptions = sizesForColor(product, selectedColor).map((size) => ({
    value: size,
    label: sizeLabel(size),
    disabled: variantStock(product, selectedColor, size) === 0,
  }));

  const galleryImages = imagesForColor(product, selectedColor);

  const selectColor = (color: string) => {
    setSelectedColor(color);
    const nextSizes = sizesForColor(product, color);
    const firstInStock = nextSizes.find(
      (size) => variantStock(product, color, size) > 0,
    );
    setSelectedSize(firstInStock ?? nextSizes[0] ?? null);
    setQuantity(1);
  };

  const selectSize = (size: string) => {
    setSelectedSize(size);
    const stock = variantStock(product, selectedColor, size);
    setQuantity((previous) => clampQuantity(previous, stock));
  };

  return {
    selectedColor,
    selectedSize,
    currentVariant,
    colorOptions,
    sizeOptions,
    galleryImages,
    isOutOfStock,
    maxStock,
    displayedQuantity,
    selectColor,
    selectSize,
    setQuantity,
  };
}
