import type { Meta, StoryObj } from '@storybook/react';
import { productFixture } from '@/entities/product/model/product.fixture';
import { ProductDetails } from './ProductDetails';

const meta = {
  title: 'Widgets/ProductDetails',
  component: ProductDetails,
  argTypes: {
    demoState: {
      control: 'select',
      options: ['default', 'out-of-stock', 'max'],
    },
  },
} satisfies Meta<typeof ProductDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { product: productFixture, demoState: 'default' },
  // Re-key on demo state so selection state re-initialises when the control changes.
  render: (args) => <ProductDetails key={args.demoState} {...args} />,
};
