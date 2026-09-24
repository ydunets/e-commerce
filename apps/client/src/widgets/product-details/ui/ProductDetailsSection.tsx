import * as stylex from '@stylexjs/stylex';
import type { Product } from '@/entities/product';
import { colors } from '@/shared/ui/tokens.stylex';
import { ProductDetails } from './ProductDetails';

export type TProductDetailsSectionProps = {
  product: Product;
};

const styles = stylex.create({
  status: {
    width: '100%',
    borderRadius: '1rem',
    backgroundColor: '#fff',
    padding: '2.5rem',
    textAlign: 'center',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: colors.muted,
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
});

// Data flows down: the route loader fetches the product; this section only
// presents it. Re-keying on product identity re-initialises the selection
// state (docs/react/you-might-not-need-an-effect.md §3).
export const ProductDetailsSection = ({
  product,
}: TProductDetailsSectionProps) => (
  <ProductDetails key={product.id} product={product} />
);

export const ProductPending = () => (
  <div {...stylex.props(styles.status)}>Loading product…</div>
);
