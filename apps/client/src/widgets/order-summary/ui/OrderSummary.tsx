import type { CartResponseDto } from '@e-commerce/contracts';
import { useId } from 'react';
import { cartTotals, formatUsd } from '@/entities/cart';
import { Badge } from '@/shared/ui/badge';
import { CouponField } from './CouponField';
import styles from './OrderSummary.module.css';

export type TOrderSummaryProps = {
  cart: CartResponseDto;
};

const FREE_SHIPPING = 'FREE';

export const OrderSummary = ({ cart }: TOrderSummaryProps) => {
  const headingId = useId();
  const totals = cartTotals(cart.lines, cart.coupons);

  return (
    <section aria-labelledby={headingId} className={styles.root}>
      <h2 id={headingId} className={styles.heading}>
        Order Summary
      </h2>

      <div className={styles.details}>
        <dl className={styles.rows}>
          <div className={styles.row}>
            <dt className={styles.label}>Subtotal</dt>
            <dd className={styles.amount}>{formatUsd(totals.subtotal)}</dd>
          </div>

          <div className={styles.row}>
            <dt className={styles.label}>Shipping</dt>
            <dd className={styles.amount}>{FREE_SHIPPING}</dd>
          </div>

          {totals.discounts.map((discount) => (
            <div key={discount.code} className={styles.row}>
              <dt className={styles.label}>
                <Badge variant="brand">{discount.code}</Badge>
              </dt>
              <dd className={styles.amount}>{formatUsd(-discount.amount)}</dd>
            </div>
          ))}
        </dl>

        <CouponField cart={cart} />
      </div>

      <hr className={styles.separator} />

      <p className={styles.footer}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalAmount}>{formatUsd(totals.total)}</span>
      </p>
    </section>
  );
};
