import type { Meta, StoryObj } from '@storybook/react';
import {
  discountedProductListItemFixture,
  outOfStockColorProductListItemFixture,
  productListItemFixture,
  selectedOutOfStockProductListItemFixture,
  singleColorProductListItemFixture,
} from '@/entities/product/model/productListItem.fixture';
import { withRouter } from '@/shared/lib/storybookRouter';
import { Button } from '@/shared/ui/button';
import { ProductGridSection } from './ProductGridSection';

const PRODUCTS = [
  productListItemFixture,
  discountedProductListItemFixture,
  singleColorProductListItemFixture,
  outOfStockColorProductListItemFixture,
  selectedOutOfStockProductListItemFixture,
];

const meta = {
  title: 'Widgets/ProductGridSection',
  component: ProductGridSection,
  decorators: [withRouter],
  args: { title: 'Latest Arrivals', products: PRODUCTS },
} satisfies Meta<typeof ProductGridSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// The grid's column count is a viewport media query (md/lg), not a container
// query, so the breakpoint has to come from resizing the story's actual
// viewport (via the viewport addon), not a fixed-width wrapper div.
export const Desktop: Story = {
  globals: { viewport: { value: 'desktop' } },
};

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet' } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile' } },
};

export const WithoutAction: Story = {
  args: { action: undefined },
};

export const WithAction: Story = {
  args: {
    action: (
      <Button href="/products" variant="secondary">
        View all
      </Button>
    ),
  },
};
