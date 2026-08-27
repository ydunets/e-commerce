import { expect, test } from '@rstest/core';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  discountedCartLineFixture,
  fullPriceCartLineFixture,
} from '../src/entities/cart/model/cart.fixture';
import {
  CartLineRow,
  type TCartLineRowProps,
} from '../src/widgets/cart-lines/ui/CartLineRow';

const INCREASE = { name: 'Increase quantity' } as const;
const REMOVE = { name: 'Remove' } as const;

const NOOP = () => {};

function renderRow(overrides: Partial<TCartLineRowProps>) {
  const props: TCartLineRowProps = {
    line: discountedCartLineFixture,
    onQuantityChange: NOOP,
    onRemoveRequest: NOOP,
    ...overrides,
  };
  const rootRoute = createRootRoute({
    component: () => (
      <ul>
        <CartLineRow {...props} />
      </ul>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

test('links the name to the product detail page and shows the struck price', async () => {
  renderRow({ line: discountedCartLineFixture });

  const nameLink = await screen.findByRole('link', {
    name: discountedCartLineFixture.name,
  });
  expect(nameLink).toHaveAttribute(
    'href',
    `/products/${discountedCartLineFixture.product_id}`,
  );
  expect(screen.getByText('Brown • S')).toBeInTheDocument();
  expect(
    screen.getByText(discountedCartLineFixture.description),
  ).toBeInTheDocument();
  expect(
    screen.getByText(`$${discountedCartLineFixture.sale_price}`),
  ).toBeInTheDocument();
  expect(
    screen.getByText(`$${discountedCartLineFixture.list_price}`),
  ).toBeInTheDocument();
});

test('omits the size and the struck price for a full-price one-size line', async () => {
  renderRow({ line: fullPriceCartLineFixture });

  await screen.findByRole('link', { name: fullPriceCartLineFixture.name });
  expect(screen.getByText('Blue')).toBeInTheDocument();
  expect(
    screen.getByText(`$${fullPriceCartLineFixture.sale_price}`),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Original price/)).not.toBeInTheDocument();
});

test('reports the next quantity and disables increase at the stock maximum', async () => {
  const user = userEvent.setup();
  const reported: number[] = [];
  renderRow({
    line: discountedCartLineFixture,
    onQuantityChange: (quantity) => reported.push(quantity),
  });

  const increase = await screen.findByRole('button', INCREASE);
  await user.click(increase);
  expect(reported).toEqual([discountedCartLineFixture.quantity + 1]);

  const { container } = renderRow({
    line: {
      ...discountedCartLineFixture,
      quantity: discountedCartLineFixture.stock,
    },
  });
  const atMax = await within(container).findByRole('button', INCREASE);
  expect(atMax).toBeDisabled();
});

test('the Remove link requests removal instead of deleting directly', async () => {
  const user = userEvent.setup();
  let requests = 0;
  renderRow({
    line: discountedCartLineFixture,
    onRemoveRequest: () => {
      requests += 1;
    },
  });

  await user.click(await screen.findByRole('button', REMOVE));
  expect(requests).toBe(1);
});
