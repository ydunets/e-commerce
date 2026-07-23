import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { SizeSelector } from './SizeSelector';

const meta = {
  title: 'Shared/SizeSelector',
  component: SizeSelector,
  args: { onChange: fn() },
} satisfies Meta<typeof SizeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M', disabled: true },
  { value: 'lg', label: 'L' },
];

export const Interactive: Story = {
  args: { options: OPTIONS, value: 'sm' },
  render: (args) => {
    const [value, setValue] = useState<string | null>(args.value);
    return (
      <SizeSelector
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
