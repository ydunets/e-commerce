import type { Meta, StoryObj } from '@storybook/react';
import type { Product } from '@/entities/product';
import { productFixture } from '@/entities/product/model/product.fixture';
import { ProductDetails } from './ProductDetails';

const withStock = (stock: number): Product => ({
  ...productFixture,
  variants: productFixture.variants.map((variant) => ({
    ...variant,
    stock,
  })),
});

const meta = {
  title: 'Widgets/ProductDetails',
  component: ProductDetails,
} satisfies Meta<typeof ProductDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { product: productFixture },
};

export const OutOfStock: Story = {
  args: { product: withStock(0) },
};

export const LastItem: Story = {
  args: { product: withStock(1) },
};
