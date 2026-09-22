import * as stylex from '@stylexjs/stylex';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { squareImage } from '@/shared/lib/image';
import { ColorSwatches } from '@/shared/ui/color-swatches';
import { focusRing } from '@/shared/ui/focus-ring';
import { PriceTag } from '@/shared/ui/price-tag';
import { colors } from '@/shared/ui/tokens.stylex';
import { colorLabel } from '../lib/colorLabel';
import type { ProductListItem } from '../model/types';

export type TProductCardProps = {
  product: ProductListItem;
};

const CARD_IMAGE_SIZE = 600;

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  link: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.25rem',
    borderRadius: '0.5rem',
  },
  image: {
    marginBottom: '0.75rem',
    aspectRatio: '1 / 1',
    width: '100%',
    borderRadius: '0.5rem',
    objectFit: 'cover',
  },
  imageFallback: { backgroundColor: colors.surface },
  color: { fontSize: '0.75rem', lineHeight: '1rem', color: colors.muted },
  name: {
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontWeight: 500,
    color: colors.ink,
  },
  price: { marginTop: '0.25rem' },
});

export const ProductCard = ({ product }: TProductCardProps) => {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.color);
  const selected =
    product.colors.find((variant) => variant.color === selectedColor) ??
    product.colors[0];

  return (
    <article {...stylex.props(styles.root)}>
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        aria-label={product.name}
        {...stylex.props(styles.link, focusRing.ring)}
      >
        {selected?.imageUrl ? (
          <img
            src={squareImage(selected.imageUrl, CARD_IMAGE_SIZE)}
            alt=""
            loading="lazy"
            {...stylex.props(styles.image)}
          />
        ) : (
          <span
            {...stylex.props(styles.image, styles.imageFallback)}
            aria-hidden="true"
          />
        )}
        {selected && (
          <span {...stylex.props(styles.color)}>
            {colorLabel(selected.color)}
          </span>
        )}
        <span {...stylex.props(styles.name)}>{product.name}</span>
        {selected && (
          <span {...stylex.props(styles.price)}>
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
