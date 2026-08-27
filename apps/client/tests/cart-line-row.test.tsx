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
const CONFIRM_DIALOG = { name: 'Confirm item removal' } as const;
const YES = { name: 'Yes' } as const;
const CANCEL = { name: 'Cancel' } as const;

const NOOP = () => {};

function renderRow(overrides: Partial<TCartLineRowProps>) {
  const props: TCartLineRowProps = {
    line: discountedCartLineFixture,
    onQuantityChange: NOOP,
    onRemove: NOOP,
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

test('removes only after the dialog is confirmed', async () => {
  const user = userEvent.setup();
  let removed = 0;
  renderRow({
    line: discountedCartLineFixture,
    onRemove: () => {
      removed += 1;
    },
  });

  await user.click(await screen.findByRole('button', REMOVE));
  const dialog = screen.getByRole('dialog', CONFIRM_DIALOG);
  expect(dialog).toBeInTheDocument();

  await user.click(screen.getByRole('button', CANCEL));
  expect(removed).toBe(0);

  await user.click(screen.getByRole('button', REMOVE));
  await user.click(screen.getByRole('button', YES));
  expect(removed).toBe(1);
});
