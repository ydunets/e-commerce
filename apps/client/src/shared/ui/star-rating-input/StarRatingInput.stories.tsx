import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { StarRatingInput, type TStarRatingInputProps } from './StarRatingInput';

const ControlledStarRatingInput = (props: TStarRatingInputProps) => {
  const [value, setValue] = useState(props.value);
  return (
    <StarRatingInput
      {...props}
      value={value}
      onChange={(next) => {
        props.onChange(next);
        setValue(next);
      }}
    />
  );
};

const meta = {
  title: 'Shared/StarRatingInput',
  component: StarRatingInput,
  args: { onChange: fn() },
} satisfies Meta<typeof StarRatingInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: { value: 3 },
  render: (args) => <ControlledStarRatingInput {...args} />,
};

export const Empty: Story = {
  args: { value: 0 },
  render: (args) => <ControlledStarRatingInput {...args} />,
};

export const ReadOnly: Story = {
  args: { value: 4, readOnly: true },
};
