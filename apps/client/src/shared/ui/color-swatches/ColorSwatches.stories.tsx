import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorSwatches } from './ColorSwatches';

const meta = {
  title: 'Shared/ColorSwatches',
  component: ColorSwatches,
} satisfies Meta<typeof ColorSwatches>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: 'green', label: 'Green' },
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black', disabled: true },
];

export const Interactive: Story = {
  args: { options: OPTIONS, value: 'green', onChange: () => {} },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <ColorSwatches {...args} value={value} onChange={setValue} />;
  },
};
