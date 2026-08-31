import type { AppliedCouponDto, CartLineDto } from '@e-commerce/contracts';
import { expect, test } from '@rstest/core';
import { cartTotals, formatUsd } from '../src/entities/cart/lib/pricing';
import {
  discountedCartLineFixture,
  fixedCouponFixture,
  fullPriceCartLineFixture,
  percentageCouponFixture,
} from '../src/entities/cart/model/cart.fixture';

// 76.00 x 2 + 45.00 x 1
const LINES = [discountedCartLineFixture, fullPriceCartLineFixture];
const SUBTOTAL = 197;
const PERCENTAGE_DISCOUNT = 29.55;
const FIXED_DISCOUNT = 5;
const OVERSIZED_VALUE = 500;
const OVERSIZED_CODE = 'TAKEITALL';

const lineAt = (salePrice: number, quantity: number): CartLineDto => ({
  ...fullPriceCartLineFixture,
  list_price: salePrice,
  sale_price: salePrice,
  quantity,
});

const fixedCoupon = (code: string, value: number): AppliedCouponDto => ({
  code,
  discount_type: 'fixed',
  value,
});

// Comparing money as integers keeps the balance assertion free of the float
// error that summing the rendered rows would otherwise introduce.
const inCents = (amount: number): number => Math.round(amount * 100);

test('sums the sale price of every line when no coupon applies', () => {
  const totals = cartTotals(LINES, []);

  expect(totals.subtotal).toBe(SUBTOTAL);
  expect(totals.discounts).toEqual([]);
  expect(totals.total).toBe(SUBTOTAL);
});

test('reports zero for an empty cart', () => {
  expect(cartTotals([], [])).toEqual({ subtotal: 0, discounts: [], total: 0 });
});

test('takes a percentage coupon off the subtotal', () => {
  const totals = cartTotals(LINES, [percentageCouponFixture]);

  expect(totals.discounts).toEqual([
    { code: percentageCouponFixture.code, amount: PERCENTAGE_DISCOUNT },
  ]);
  expect(totals.total).toBe(SUBTOTAL - PERCENTAGE_DISCOUNT);
});

test('takes a fixed coupon off the subtotal', () => {
  const totals = cartTotals(LINES, [fixedCouponFixture]);

  expect(totals.discounts).toEqual([
    { code: fixedCouponFixture.code, amount: FIXED_DISCOUNT },
  ]);
  expect(totals.total).toBe(SUBTOTAL - FIXED_DISCOUNT);
});

test('stacks coupons in application order, each against the subtotal', () => {
  const totals = cartTotals(LINES, [
    percentageCouponFixture,
    fixedCouponFixture,
  ]);

  expect(totals.discounts).toEqual([
    { code: percentageCouponFixture.code, amount: PERCENTAGE_DISCOUNT },
    { code: fixedCouponFixture.code, amount: FIXED_DISCOUNT },
  ]);
  expect(totals.total).toBe(SUBTOTAL - PERCENTAGE_DISCOUNT - FIXED_DISCOUNT);
});

test('rounds a percentage discount to whole cents', () => {
  const totals = cartTotals([lineAt(33.33, 1)], [percentageCouponFixture]);

  expect(totals.discounts[0]?.amount).toBe(5);
  expect(totals.total).toBe(28.33);
});

test('keeps a subtotal of repeated fractional prices exact', () => {
  expect(cartTotals([lineAt(0.1, 3)], []).subtotal).toBe(0.3);
});

test('clamps a coupon worth more than the cart to the remainder', () => {
  const totals = cartTotals(LINES, [
    fixedCoupon(OVERSIZED_CODE, OVERSIZED_VALUE),
  ]);

  expect(totals.discounts).toEqual([
    { code: OVERSIZED_CODE, amount: SUBTOTAL },
  ]);
  expect(totals.total).toBe(0);
});

test('leaves nothing for a coupon applied after the cart is exhausted', () => {
  const totals = cartTotals(LINES, [
    fixedCoupon(OVERSIZED_CODE, OVERSIZED_VALUE),
    fixedCouponFixture,
  ]);

  expect(totals.discounts).toEqual([
    { code: OVERSIZED_CODE, amount: SUBTOTAL },
    { code: fixedCouponFixture.code, amount: 0 },
  ]);
  expect(totals.total).toBe(0);
});

test('always balances the discount rows it renders against the total', () => {
  const totals = cartTotals(
    [lineAt(19.99, 3), lineAt(4.95, 7)],
    [percentageCouponFixture, fixedCouponFixture, fixedCoupon('CENT', 0.01)],
  );
  const discounted = totals.discounts.reduce(
    (cents, discount) => cents + inCents(discount.amount),
    0,
  );

  expect(inCents(totals.subtotal) - discounted).toBe(inCents(totals.total));
});

test('formats an amount to the cent', () => {
  expect(formatUsd(162.5)).toBe('$162.50');
  expect(formatUsd(SUBTOTAL)).toBe('$197.00');
});

test('formats a negated amount with a leading minus', () => {
  expect(formatUsd(-FIXED_DISCOUNT)).toBe('-$5.00');
});

test('never formats a signed zero', () => {
  expect(formatUsd(-0)).toBe('$0.00');
});
