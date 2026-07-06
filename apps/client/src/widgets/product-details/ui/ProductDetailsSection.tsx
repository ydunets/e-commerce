import type { Product } from '@/entities/product';
import type { DemoState } from '../lib/product-display';
import { ProductDetails } from './ProductDetails';
import styles from './ProductDetailsSection.module.css';

export type TProductDetailsSectionProps = {
  product: Product;
  demoState?: DemoState;
};

// Data flows down: the route loader fetches the product; this section only
// presents it. Re-keying on product identity and demo state re-initialises
// the selection state (docs/react/you-might-not-need-an-effect.md §3).
export const ProductDetailsSection = ({
  product,
  demoState = 'default',
}: TProductDetailsSectionProps) => (
  <ProductDetails
    key={`${product.id}-${demoState}`}
    product={product}
    demoState={demoState}
  />
);

export const ProductPending = () => (
  <div className={styles.status}>Loading product…</div>
);

export const ProductError = ({ message }: { message: string }) => (
  <div className={styles.error}>Could not load the product: {message}</div>
);
