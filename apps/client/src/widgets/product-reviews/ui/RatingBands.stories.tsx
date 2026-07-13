import type { Meta, StoryObj } from '@storybook/react';
import { RatingBands } from './RatingBands';

const meta = {
  title: 'Widgets/ProductReviews/RatingBands',
  component: RatingBands,
} satisfies Meta<typeof RatingBands>;

export default meta;
type Story = StoryObj<typeof meta>;

const distribution = { 5: 24, 4: 22, 3: 12, 2: 4, 1: 0 } as const;

export const Default: Story = {
  args: { distribution, total: 62, activeRating: null, onSelect: () => {} },
};

export const Filtered: Story = {
  args: { distribution, total: 62, activeRating: 2, onSelect: () => {} },
};

export const Empty: Story = {
  args: {
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    total: 0,
    activeRating: null,
    onSelect: () => {},
  },
};
