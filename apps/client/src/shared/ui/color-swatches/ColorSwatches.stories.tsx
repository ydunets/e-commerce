import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ColorSwatches } from './ColorSwatches';

const meta = {
  title: 'Shared/ColorSwatches',
  component: ColorSwatches,
  args: { onChange: fn() },
} satisfies Meta<typeof ColorSwatches>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: 'green', label: 'Green' },
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black', disabled: true },
];

const renderInteractive: Story['render'] = (args) => {
  const [value, setValue] = useState(args.value);
  return (
    <ColorSwatches
      {...args}
      value={value}
      onChange={(next) => {
        args.onChange(next);
        setValue(next);
      }}
    />
  );
};

export const Interactive: Story = {
  args: { options: OPTIONS, value: 'green' },
  render: renderInteractive,
};

export const OutOfStock: Story = {
  args: {
    options: [
      { value: 'green', label: 'Green' },
      { value: 'yellow', label: 'Yellow', outOfStock: true },
      { value: 'black', label: 'Black', disabled: true },
    ],
    value: 'green',
  },
  render: renderInteractive,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const outOfStock = canvas.getByRole('radio', {
      name: 'Yellow (out of stock)',
    });
    await userEvent.click(outOfStock);
    await expect(outOfStock).toBeChecked();

    await userEvent.keyboard('{ArrowLeft}');
    await expect(canvas.getByRole('radio', { name: 'Green' })).toBeChecked();

    await userEvent.keyboard('{ArrowRight}');
    await expect(outOfStock).toBeChecked();
  },
};

export const SelectedOutOfStock: Story = {
  args: {
    options: [
      { value: 'green', label: 'Green' },
      { value: 'yellow', label: 'Yellow', outOfStock: true },
    ],
    value: 'yellow',
  },
  render: renderInteractive,
};
