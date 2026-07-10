import type { Meta, StoryObj } from '@storybook/react';
import { Stars } from './Stars';

const meta = {
  title: 'Shared/Stars',
  component: Stars,
} satisfies Meta<typeof Stars>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = { args: { rating: 5 } };
export const Fractional: Story = { args: { rating: 4.1 } };
export const Empty: Story = { args: { rating: 0, label: 'Not yet rated' } };
