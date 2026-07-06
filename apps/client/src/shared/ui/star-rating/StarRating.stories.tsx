import type { Meta, StoryObj } from '@storybook/react';
import { StarRating } from './StarRating';

const meta = {
  title: 'Shared/StarRating',
  component: StarRating,
} satisfies Meta<typeof StarRating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithReviews: Story = {
  args: { rating: 4.4, reviewCount: 62 },
};

export const NoReviews: Story = {
  args: { rating: 0, reviewCount: 0 },
};

export const Perfect: Story = {
  args: { rating: 5, reviewCount: 12 },
};
