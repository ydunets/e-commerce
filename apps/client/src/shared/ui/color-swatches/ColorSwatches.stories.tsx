import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
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

export const Interactive: Story = {
  args: { options: OPTIONS, value: 'green' },
  render: (args) => {
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
  },
};
