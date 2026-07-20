import type { ReactNode } from 'react';
import { ProductCard, type ProductListItem } from '@/entities/product';
import styles from './ProductGridSection.module.css';

export type TProductGridSectionProps = {
  title: string;
  products: ProductListItem[];
  action?: ReactNode;
};

export const ProductGridSection = ({
  title,
  products,
  action,
}: TProductGridSectionProps) => (
  <section className={styles.root} aria-label={title}>
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {action}
    </div>
    <ul className={styles.grid}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  </section>
);
