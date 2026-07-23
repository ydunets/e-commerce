import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { squareImage } from '@/shared/lib/image';
import { ColorSwatches } from '@/shared/ui/color-swatches';
import { PriceTag } from '@/shared/ui/price-tag';
import { colorLabel } from '../lib/colorLabel';
import type { ProductListItem } from '../model/types';
import styles from './ProductCard.module.css';

export type TProductCardProps = {
  product: ProductListItem;
};

const CARD_IMAGE_SIZE = 600;

export const ProductCard = ({ product }: TProductCardProps) => {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.color);
  const selected =
    product.colors.find((variant) => variant.color === selectedColor) ??
    product.colors[0];

  return (
    <article className={styles.root}>
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        aria-label={product.name}
        className={styles.link}
      >
        {selected?.imageUrl ? (
          <img
            src={squareImage(selected.imageUrl, CARD_IMAGE_SIZE)}
            alt=""
            loading="lazy"
            className={styles.image}
          />
        ) : (
          <span className={styles.imageFallback} aria-hidden="true" />
        )}
        {selected && (
          <span className={styles.color}>{colorLabel(selected.color)}</span>
        )}
        <span className={styles.name}>{product.name}</span>
        {selected && (
          <span className={styles.price}>
            <PriceTag price={selected.price} size="sm" showBadge={false} />
          </span>
        )}
      </Link>
      {selected && (
        <ColorSwatches
          options={product.colors.map((variant) => ({
            value: variant.color,
            label: colorLabel(variant.color),
            outOfStock: variant.outOfStock,
          }))}
          value={selected.color}
          onChange={setSelectedColor}
          label={`${product.name} colors`}
          size="sm"
        />
      )}
    </article>
  );
};
