import type { Product } from '@/entities/product';
import { ProductDetails } from './ProductDetails';
import styles from './ProductDetailsSection.module.css';

export type TProductDetailsSectionProps = {
  product: Product;
};

// Data flows down: the route loader fetches the product; this section only
// presents it. Re-keying on product identity re-initialises the selection
// state (docs/react/you-might-not-need-an-effect.md §3).
export const ProductDetailsSection = ({
  product,
}: TProductDetailsSectionProps) => (
  <ProductDetails key={product.id} product={product} />
);

export const ProductPending = () => (
  <div className={styles.status}>Loading product…</div>
);

export const ProductError = ({ message }: { message: string }) => (
  <div className={styles.error}>Could not load the product: {message}</div>
);
