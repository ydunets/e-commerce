import type { AppliedCouponDto, CartLineDto } from '@e-commerce/contracts';

export type TCouponDiscount = {
  code: string;
  amount: number;
};

export type TCartTotals = {
  subtotal: number;
  discounts: TCouponDiscount[];
  total: number;
};

const CENTS_PER_UNIT = 100;
const PERCENT = 100;

const roundToCents = (amount: number): number =>
  Math.round(amount * CENTS_PER_UNIT) / CENTS_PER_UNIT;

/**
 * The order summary and the checkout page derive their figures here, during
 * render, from the enriched cart lines and the coupons the server reports as
 * applied. Every percentage is taken against the untouched subtotal, and a
 * coupon worth more than what is left is clamped to the remainder, so the
 * discount rows on screen always add up to subtotal minus total.
 */
export function cartTotals(
  lines: readonly CartLineDto[],
  coupons: readonly AppliedCouponDto[],
): TCartTotals {
  const subtotal = roundToCents(
    lines.reduce((sum, line) => sum + line.sale_price * line.quantity, 0),
  );

  let remaining = subtotal;
  const discounts = coupons.map((coupon) => {
    const claimed =
      coupon.discount_type === 'percentage'
        ? roundToCents((subtotal * coupon.value) / PERCENT)
        : roundToCents(coupon.value);
    const amount = Math.min(claimed, remaining);
    remaining = roundToCents(remaining - amount);
    return { code: coupon.code, amount };
  });

  return { subtotal, discounts, total: remaining };
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatUsd(amount: number): string {
  // Not a no-op: folds the -0 a negated zero discount produces, which Intl
  // would otherwise render as "-$0.00".
  return usd.format(amount === 0 ? 0 : amount);
}
