import type { Meta, StoryObj } from '@storybook/react';
import { withRouter } from '@/shared/lib/storybookRouter';
import {
  discountedProductListItemFixture,
  outOfStockColorProductListItemFixture,
  productListItemFixture,
  selectedOutOfStockProductListItemFixture,
  singleColorProductListItemFixture,
} from '../model/productListItem.fixture';
import { ProductCard } from './ProductCard';

const meta = {
  title: 'Entities/ProductCard',
  component: ProductCard,
  // The card has no intrinsic width of its own — its grid column supplies
  // one in the app. Fix it to Figma's card width (280px) so stories don't
  // stretch to fill the Storybook canvas.
  decorators: [
    withRouter,
    (Story) => <div style={{ width: 280 }}>{Story()}</div>,
  ],
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { product: productListItemFixture },
};

export const Discounted: Story = {
  args: { product: discountedProductListItemFixture },
};

export const SingleColor: Story = {
  args: { product: singleColorProductListItemFixture },
};

export const OutOfStockColor: Story = {
  args: { product: outOfStockColorProductListItemFixture },
};

export const SelectedOutOfStock: Story = {
  args: { product: selectedOutOfStockProductListItemFixture },
};
