import { cx } from '@/shared/lib/cx';
import { isDiscounted, type Price } from '@/shared/lib/price';
import { Badge } from '@/shared/ui/badge';
import styles from './PriceTag.module.css';

export type TPriceTagSize = 'sm' | 'lg';

export type TPriceTagProps = {
  price: Price;
  size?: TPriceTagSize;
  showBadge?: boolean;
};

export const PriceTag = ({
  price,
  size = 'lg',
  showBadge = true,
}: TPriceTagProps) => {
  const hasDiscount = isDiscounted(price);

  return (
    <div className={cx(styles.root, size === 'sm' && styles.sm)}>
      <div className={styles.prices}>
        <span className={styles.sale}>${price.sale}</span>
        {hasDiscount && (
          <span className={styles.list}>
            <span className="sr-only">Original price </span>${price.list}
          </span>
        )}
      </div>
      {showBadge && hasDiscount && (
        <Badge variant="warning">{price.discountPercentage}% OFF</Badge>
      )}
    </div>
  );
};
