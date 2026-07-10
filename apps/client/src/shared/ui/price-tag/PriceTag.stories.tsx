import type { Meta, StoryObj } from '@storybook/react';
import { PriceTag } from './PriceTag';

const meta = {
  title: 'Shared/PriceTag',
  component: PriceTag,
} satisfies Meta<typeof PriceTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnSale: Story = {
  args: { price: { sale: 76, list: 95, discountPercentage: 20 } },
};

export const FullPrice: Story = {
  args: { price: { sale: 95, list: 95, discountPercentage: null } },
};
