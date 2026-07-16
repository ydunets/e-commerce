import type { Meta, StoryObj } from '@storybook/react';
import { ProductSpecificationsSection } from './ProductSpecificationsSection';

const meta = {
  title: 'Widgets/ProductSpecifications',
  component: ProductSpecificationsSection,
} satisfies Meta<typeof ProductSpecificationsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
