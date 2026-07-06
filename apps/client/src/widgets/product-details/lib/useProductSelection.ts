import { useState } from 'react';
import type { Product } from '@/entities/product';
import {
  colorLabel,
  type DemoState,
  findVariant,
  imagesForColor,
  isColorSoldOut,
  sizeLabel,
  sizesForColor,
  variantStock,
} from './product-display';

export function useProductSelection(product: Product, demoState: DemoState) {
  const colors = product.colors;

  // Initial selection is stock-agnostic and can land on a sold-out size, unlike `selectColor`.
  const initialColor = colors[0] ?? '';
  const initialSize = sizesForColor(product, initialColor)[0] ?? null;
  const initialStock = variantStock(product, initialColor, initialSize);

  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize);
  const [quantity, setQuantity] = useState(
    demoState === 'max' ? initialStock : 1,
  );

  const forcedOutOfStock = demoState === 'out-of-stock';
  const currentVariant = findVariant(product, selectedColor, selectedSize);
  const isOutOfStock = forcedOutOfStock || (currentVariant?.stock ?? 0) === 0;
  const maxStock = isOutOfStock ? 0 : (currentVariant?.stock ?? 0);
  const displayedQuantity = isOutOfStock ? 0 : quantity;

  const colorOptions = colors.map((color) => ({
    value: color,
    label: colorLabel(color),
    disabled: forcedOutOfStock || isColorSoldOut(product, color),
  }));

  const sizeOptions = sizesForColor(product, selectedColor).map((size) => ({
    value: size,
    label: sizeLabel(size),
    disabled:
      forcedOutOfStock || variantStock(product, selectedColor, size) === 0,
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
    setQuantity((previous) =>
      Math.min(Math.max(previous, 1), Math.max(stock, 1)),
    );
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
