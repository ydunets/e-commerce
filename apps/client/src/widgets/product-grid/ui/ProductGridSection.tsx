import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import { ProductCard, type ProductListItem } from '@/entities/product';
import { media } from '@/shared/lib/breakpoints.stylex';
import { colors } from '@/shared/ui/tokens.stylex';

export type TProductGridSectionProps = {
  title: string;
  products: ProductListItem[];
  action?: ReactNode;
};

const styles = stylex.create({
  // Self-contained responsive padding (Figma: mobile 12px/48px, tablet
  // 16px/64px, desktop 96px/96px) so the section carries its own breathing
  // room wherever it's dropped, including in isolation in Storybook.
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    paddingInline: {
      default: '0.75rem',
      [media.md]: '1rem',
      [media.lg]: '6rem',
    },
    paddingBlock: { default: '3rem', [media.md]: '4rem', [media.lg]: '6rem' },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  title: {
    fontSize: { default: '1.5rem', [media.md]: '1.875rem' },
    lineHeight: { default: '2rem', [media.md]: '2.25rem' },
    fontWeight: 600,
    color: colors.ink,
  },
  grid: {
    display: 'grid',
    listStyle: 'none',
    gridTemplateColumns: {
      default: 'repeat(1, minmax(0, 1fr))',
      [media.md]: 'repeat(2, minmax(0, 1fr))',
      [media.lg]: 'repeat(4, minmax(0, 1fr))',
    },
    gap: '2rem',
    padding: 0,
  },
});

export const ProductGridSection = ({
  title,
  products,
  action,
}: TProductGridSectionProps) => (
  <section {...stylex.props(styles.root)} aria-label={title}>
    <div {...stylex.props(styles.header)}>
      <h2 {...stylex.props(styles.title)}>{title}</h2>
      {action}
    </div>
    <ul {...stylex.props(styles.grid)}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  </section>
);
