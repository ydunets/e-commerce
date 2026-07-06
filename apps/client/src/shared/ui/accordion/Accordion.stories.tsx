import type { Meta, StoryObj } from '@storybook/react';
import { Accordion } from './Accordion';

const meta = {
  title: 'Shared/Accordion',
  component: Accordion,
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    title: 'Features',
    items: ['Relaxed fit', 'Two-way zipper', 'Adjustable hood'],
  },
};

export const Closed: Story = {
  args: {
    title: 'Fabric & Care',
    items: ['80% organic cotton', 'Machine wash cold'],
    defaultOpen: false,
  },
};
