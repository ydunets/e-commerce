import { afterEach, expect, rs, test } from '@rstest/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CART_QUERY_KEY } from '@/entities/cart';
import { clearCartId } from '@/entities/cart/lib/cartStorage';
import { cartFixture } from '@/entities/cart/model/cart.fixture';
import { productFixture } from '@/entities/product/model/product.fixture';
import { ProductDetails } from '@/widgets/product-details/ui/ProductDetails';

const HTTP_CONFLICT = 409;
const SKU = productFixture.variants[0].sku;
const ADD = { name: 'Add to Cart' } as const;
const INCREASE = { name: 'Increase quantity' } as const;

function renderProduct() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(CART_QUERY_KEY, null);
  render(
    <QueryClientProvider client={client}>
      <ProductDetails product={productFixture} />
    </QueryClientProvider>,
  );
}

function conflictResponse(available: number) {
  return new Response(
    JSON.stringify({
      statusCode: HTTP_CONFLICT,
      message: 'Insufficient stock',
      error: 'Conflict',
      details: { sku: SKU, requested: 1, available },
    }),
    { status: HTTP_CONFLICT },
  );
}

afterEach(() => {
  rs.restoreAllMocks();
  clearCartId();
});

test('a first add sold-out conflict shows the friendly variant and disables repeated stale-stock adds after Ok', async () => {
  const user = userEvent.setup();
  const fetch = rs
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(conflictResponse(0));
  renderProduct();
  await user.click(screen.getByRole('button', ADD));
  const dialog = await screen.findByRole('dialog', {
    name: 'Insufficient stock',
  });
  expect(within(dialog).getByText(productFixture.name)).toBeInTheDocument();
  expect(within(dialog).getByText('Green • S')).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button', { name: 'Ok' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'Insufficient stock' }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.getByRole('button', ADD)).toBeDisabled();
  expect(screen.getByRole('button', INCREASE)).toBeDisabled();
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('a successful retry retains authoritative stock after the mutation error clears', async () => {
  const user = userEvent.setup();
  const AVAILABLE = 2;
  const cart = {
    ...cartFixture,
    totalUnits: 1,
    lines: [
      { ...cartFixture.lines[0], sku: SKU, quantity: 1, stock: AVAILABLE },
    ],
  };
  rs.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(conflictResponse(AVAILABLE))
    .mockResolvedValueOnce(new Response(JSON.stringify(cart)));
  renderProduct();
  await user.click(screen.getByRole('button', ADD));
  const dialog = await screen.findByRole('dialog', {
    name: 'Insufficient stock',
  });
  await user.click(within(dialog).getByRole('button', { name: 'Ok' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'Insufficient stock' }),
    ).not.toBeInTheDocument(),
  );
  await user.click(screen.getByRole('button', ADD));
  await waitFor(() =>
    expect(screen.getByRole('button', INCREASE)).toBeDisabled(),
  );
  expect(screen.getByRole('group', { name: 'Quantity' })).toHaveTextContent(
    '1',
  );
});
