import { isDiscounted, type Price } from '@/shared/lib/price';
import { Badge } from '@/shared/ui/badge';
import styles from './PriceTag.module.css';

export type TPriceTagProps = {
  price: Price;
};

export const PriceTag = ({ price }: TPriceTagProps) => {
  const hasDiscount = isDiscounted(price);

  return (
    <div className={styles.root}>
      <div className={styles.prices}>
        <span className={styles.sale}>${price.sale}</span>
        {hasDiscount && (
          <span className={styles.list}>
            <span className="sr-only">Original price </span>${price.list}
          </span>
        )}
      </div>
      {hasDiscount && (
        <Badge variant="warning">{price.discountPercentage}% OFF</Badge>
      )}
    </div>
  );
};
