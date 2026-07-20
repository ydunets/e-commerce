import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Shared/Button',
  component: Button,
  args: { onClick: fn() },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary'],
    },
    size: { control: 'select', options: ['md', 'lg', 'xl'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: 'Add to Cart', variant: 'primary', size: 'xl' },
};

export const Secondary: Story = {
  args: { children: 'View details', variant: 'secondary', size: 'lg' },
};

export const Tertiary: Story = {
  args: { children: 'Dismiss', variant: 'tertiary', size: 'md' },
};

export const Disabled: Story = {
  args: { children: 'Add to Cart', size: 'xl', disabled: true },
};
