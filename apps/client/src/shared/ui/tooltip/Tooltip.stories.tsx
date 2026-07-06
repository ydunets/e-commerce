import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'Shared/Tooltip',
  component: Tooltip,
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
  },
  // Give the tooltip room to render in the preview.
  decorators: [
    (Story) => (
      <div className="flex h-40 items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const Trigger = (
  <button
    type="button"
    className="rounded-lg border border-line px-4 py-2 text-sm text-ink"
  >
    Hover or focus me
  </button>
);

export const Top: Story = {
  args: { content: 'Insufficient stock', position: 'top', children: Trigger },
};

export const Bottom: Story = {
  args: { content: 'Added to your bag', position: 'bottom', children: Trigger },
};

export const Right: Story = {
  args: { content: 'Only 2 left', position: 'right', children: Trigger },
};
