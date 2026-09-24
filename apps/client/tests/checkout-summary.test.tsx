import { expect, test } from '@rstest/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import {
  cartFixture,
  fixedCouponFixture,
  percentageCouponFixture,
} from '@/entities/cart/model/cart.fixture';
import { CartLines } from '@/widgets/cart-lines';
import { OrderSummary } from '@/widgets/order-summary';

const cart = {
  ...cartFixture,
  coupons: [percentageCouponFixture, fixedCouponFixture],
};
const EXPECTED_TOTAL = '$162.45';
const EXPECTED_SUBTOTAL = '$197.00';

test('read-only checkout retains lines, stacked discounts and totals without cart editing controls', async () => {
  const client = new QueryClient();
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <CartLines cart={cart} readOnly />
        <OrderSummary cart={cart} readOnly />
      </>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  const summary = await screen.findByRole('region', { name: 'Order Summary' });
  expect(within(summary).getByText(EXPECTED_SUBTOTAL)).toBeInTheDocument();
  expect(within(summary).getByText(EXPECTED_TOTAL)).toBeInTheDocument();
  expect(within(summary).getByText('FREE')).toBeInTheDocument();
  for (const coupon of cart.coupons)
    expect(within(summary).getByText(coupon.code)).toBeInTheDocument();
  for (const line of cart.lines) {
    expect(screen.getByRole('link', { name: line.name })).toBeInTheDocument();
    expect(screen.getByText(`Quantity: ${line.quantity}`)).toBeInTheDocument();
  }
  expect(
    screen.queryByRole('button', { name: /quantity|remove|coupon|checkout/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('textbox', { name: 'Coupon code' }),
  ).not.toBeInTheDocument();
});
