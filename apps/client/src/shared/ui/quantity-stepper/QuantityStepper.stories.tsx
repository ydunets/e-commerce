import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { QuantityStepper } from './QuantityStepper';

const meta = {
  title: 'Shared/QuantityStepper',
  component: QuantityStepper,
} satisfies Meta<typeof QuantityStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

export const Interactive: Story = {
  args: { value: 1, max: 10, onChange: noop },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <QuantityStepper {...args} value={value} onChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: { value: 0, max: 0, disabled: true, onChange: noop },
};
