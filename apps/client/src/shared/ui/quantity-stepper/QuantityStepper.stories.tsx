import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { QuantityStepper } from './QuantityStepper';

const meta = {
  title: 'Shared/QuantityStepper',
  component: QuantityStepper,
  args: { onChange: fn() },
} satisfies Meta<typeof QuantityStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: { value: 1, max: 10 },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <QuantityStepper
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

export const Disabled: Story = {
  args: { value: 0, max: 0, disabled: true },
};
