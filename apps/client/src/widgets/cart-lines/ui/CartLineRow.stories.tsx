import type { Meta, StoryObj } from '@storybook/react';
import {
  discountedCartLineFixture,
  fullPriceCartLineFixture,
} from '@/entities/cart/model/cart.fixture';
import { withRouter } from '@/shared/lib/storybookRouter';
import { CartLineRow } from './CartLineRow';

const meta = {
  title: 'Widgets/CartLineRow',
  component: CartLineRow,
  decorators: [
    withRouter,
    (Story) => (
      <ul style={{ listStyle: 'none', margin: 0, maxWidth: 800, padding: 0 }}>
        {Story()}
      </ul>
    ),
  ],
  args: {
    onQuantityChange: () => {},
    onRemove: () => {},
  },
} satisfies Meta<typeof CartLineRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Discounted: Story = {
  args: { line: discountedCartLineFixture },
};

export const FullPriceOneSize: Story = {
  args: { line: fullPriceCartLineFixture },
};

export const AtStockMaximum: Story = {
  args: {
    line: {
      ...discountedCartLineFixture,
      quantity: discountedCartLineFixture.stock,
    },
  },
};
