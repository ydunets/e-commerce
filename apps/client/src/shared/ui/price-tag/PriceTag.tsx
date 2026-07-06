import styles from './PriceTag.module.css';

export type TPriceTagProps = {
  salePrice: number;
  listPrice: number;
  discountPercentage?: number | null;
};

export const PriceTag = ({
  salePrice,
  listPrice,
  discountPercentage,
}: TPriceTagProps) => {
  const hasDiscount =
    discountPercentage != null &&
    discountPercentage > 0 &&
    salePrice < listPrice;

  return (
    <div className={styles.root}>
      <div className={styles.prices}>
        <span className={styles.sale}>${salePrice}</span>
        {hasDiscount && (
          <span className={styles.list}>
            <span className="sr-only">Original price </span>${listPrice}
          </span>
        )}
      </div>
      {hasDiscount && (
        <span className={styles.badge}>{discountPercentage}% OFF</span>
      )}
    </div>
  );
};
