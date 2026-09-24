import { afterEach, expect, rs, test } from '@rstest/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CART_QUERY_KEY,
  setCartState,
} from '../src/entities/cart/lib/cartState';
import { clearCartId, storeCartId } from '../src/entities/cart/lib/cartStorage';
import { cartFixture } from '../src/entities/cart/model/cart.fixture';
import { StockDialog } from '../src/widgets/stock-dialog/ui/StockDialog';

const STOCK_DIALOG = { name: 'Insufficient stock' } as const;
const OK = { name: 'Ok', exact: true } as const;
const clients: QueryClient[] = [];

afterEach(() => {
  rs.restoreAllMocks();
  clearCartId();
  for (const client of clients) client.clear();
  clients.length = 0;
});

function renderStockDialog() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  storeCartId(cartFixture.id);
  client.setQueryData(CART_QUERY_KEY, cartFixture);
  setCartState(client, {
    stock: {
      changes: cartFixture.lines.map((line) => ({
        sku: line.sku,
        name: line.name,
        previous_quantity: line.quantity,
        quantity: 0,
        stock: 0,
      })),
    },
  });
  render(
    <QueryClientProvider client={client}>
      <StockDialog />
    </QueryClientProvider>,
  );
  return client;
}

test('keeps stock corrections visible after failed Escape acknowledgement and allows retry', async () => {
  const failedRequest = Promise.withResolvers<Response>();
  const correctedCart = { ...cartFixture, lines: [], totalUnits: 0 };
  const fetch = rs
    .spyOn(globalThis, 'fetch')
    .mockReturnValueOnce(failedRequest.promise)
    .mockResolvedValueOnce(Response.json({ cart: correctedCart, changes: [] }));
  const client = renderStockDialog();
  const user = userEvent.setup();
  const dialog = screen.getByRole('dialog', STOCK_DIALOG);

  for (const line of cartFixture.lines) {
    expect(screen.getByText(line.name)).toBeVisible();
  }

  const cancel = new Event('cancel', { bubbles: true, cancelable: true });
  fireEvent(dialog, cancel);
  expect(cancel.defaultPrevented).toBe(true);
  await waitFor(() => expect(screen.getByRole('button', OK)).toBeDisabled());
  expect(dialog).toBeVisible();
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(cartFixture);

  failedRequest.reject(new Error('Network unavailable'));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't refresh stock",
    ),
  );
  expect(dialog).toBeVisible();
  expect(screen.getByRole('button', OK)).toBeEnabled();
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(cartFixture);

  await user.click(screen.getByRole('button', OK));
  await waitFor(() =>
    expect(screen.queryByRole('dialog', STOCK_DIALOG)).toBeNull(),
  );
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(correctedCart);
  expect(fetch).toHaveBeenCalledTimes(2);
});
