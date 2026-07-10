import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { StarRatingInput, type TStarRatingInputProps } from './StarRatingInput';

const ControlledStarRatingInput = (props: TStarRatingInputProps) => {
  const [value, setValue] = useState(props.value);
  return <StarRatingInput {...props} value={value} onChange={setValue} />;
};

const meta = {
  title: 'Shared/StarRatingInput',
  component: StarRatingInput,
} satisfies Meta<typeof StarRatingInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: { value: 3, onChange: () => {} },
  render: (args) => <ControlledStarRatingInput {...args} />,
};

export const Empty: Story = {
  args: { value: 0, onChange: () => {} },
  render: (args) => <ControlledStarRatingInput {...args} />,
};

export const ReadOnly: Story = {
  args: { value: 4, readOnly: true, onChange: () => {} },
};
