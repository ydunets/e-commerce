import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Shared/Badge',
  component: Badge,
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'warning', 'success', 'danger'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Discount: Story = {
  args: { children: '20% OFF', variant: 'warning' },
};

export const Neutral: Story = {
  args: { children: 'New arrival', variant: 'neutral' },
};

export const Success: Story = {
  args: { children: 'In stock', variant: 'success' },
};

export const Danger: Story = {
  args: { children: 'Sold out', variant: 'danger' },
};
