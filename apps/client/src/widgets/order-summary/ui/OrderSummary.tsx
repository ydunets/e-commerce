import type { CartResponseDto } from '@e-commerce/contracts';
import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';
import { cartTotals, formatUsd } from '@/entities/cart';
import { Badge } from '@/shared/ui/badge';
import { colors } from '@/shared/ui/tokens.stylex';
import { CouponField } from './CouponField';

export type TOrderSummaryProps = {
  cart: CartResponseDto;
};

const FREE_SHIPPING = 'FREE';

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    borderRadius: '0.5rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.line,
    backgroundColor: '#fff',
    padding: '2rem',
  },
  heading: {
    fontSize: '1.5rem',
    lineHeight: '2rem',
    fontWeight: 600,
    color: colors.ink,
  },
  details: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  rows: {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: 0,
  },
  row: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  label: {
    margin: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: colors.muted,
  },
  amount: {
    margin: 0,
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontWeight: 600,
    color: colors.ink,
  },
  separator: {
    margin: 0,
    borderWidth: '1px 0 0',
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
  },
  footer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    color: colors.ink,
  },
  totalLabel: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 500 },
  totalAmount: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    textAlign: 'right',
    fontSize: '2.25rem',
    lineHeight: '2.5rem',
    fontWeight: 600,
  },
});

export const OrderSummary = ({ cart }: TOrderSummaryProps) => {
  const headingId = useId();
  const totals = cartTotals(cart.lines, cart.coupons);

  return (
    <section aria-labelledby={headingId} {...stylex.props(styles.root)}>
      <h2 id={headingId} {...stylex.props(styles.heading)}>
        Order Summary
      </h2>

      <div {...stylex.props(styles.details)}>
        <dl {...stylex.props(styles.rows)}>
          <div {...stylex.props(styles.row)}>
            <dt {...stylex.props(styles.label)}>Subtotal</dt>
            <dd {...stylex.props(styles.amount)}>
              {formatUsd(totals.subtotal)}
            </dd>
          </div>

          <div {...stylex.props(styles.row)}>
            <dt {...stylex.props(styles.label)}>Shipping</dt>
            <dd {...stylex.props(styles.amount)}>{FREE_SHIPPING}</dd>
          </div>

          {totals.discounts.map((discount) => (
            <div key={discount.code} {...stylex.props(styles.row)}>
              <dt {...stylex.props(styles.label)}>
                <Badge variant="brand">{discount.code}</Badge>
              </dt>
              <dd {...stylex.props(styles.amount)}>
                {formatUsd(-discount.amount)}
              </dd>
            </div>
          ))}
        </dl>

        <CouponField cart={cart} />
      </div>

      <hr {...stylex.props(styles.separator)} />

      <p {...stylex.props(styles.footer)}>
        <span {...stylex.props(styles.totalLabel)}>Total</span>
        <span {...stylex.props(styles.totalAmount)}>
          {formatUsd(totals.total)}
        </span>
      </p>
    </section>
  );
};
