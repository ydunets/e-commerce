import { cx } from '@/shared/lib/cx';
import { isDiscounted, type Price } from '@/shared/lib/price';
import { Badge } from '@/shared/ui/badge';
import styles from './PriceTag.module.css';

export type TPriceTagSize = 'sm' | 'lg';

export type TPriceTagProps = {
  price: Price;
  size?: TPriceTagSize;
  showBadge?: boolean;
  /** Cart rows show the sale price in the ink color and medium weight. */
  emphasized?: boolean;
};

export const PriceTag = ({
  price,
  size = 'lg',
  showBadge = true,
  emphasized = false,
}: TPriceTagProps) => {
  const hasDiscount = isDiscounted(price);

  return (
    <div
      className={cx(
        styles.root,
        size === 'sm' && styles.sm,
        emphasized && styles.emphasized,
      )}
    >
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
