import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Tabs, type TTabsProps } from './Tabs';

const meta = {
  title: 'Shared/Tabs',
  component: Tabs,
  args: { onChange: fn() },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const tabs = [
  { id: 'sustainability', label: 'Sustainability' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'durability', label: 'Durability' },
  { id: 'versatility', label: 'Versatility' },
];

const ControlledTabs = (args: TTabsProps) => {
  const [activeId, setActiveId] = useState(args.activeId);
  return (
    <Tabs
      {...args}
      activeId={activeId}
      onChange={(next) => {
        args.onChange(next);
        setActiveId(next);
      }}
    />
  );
};

export const Default: Story = {
  args: {
    tabs,
    activeId: 'sustainability',
    label: 'Product features',
    idPrefix: 'story',
  },
  render: (args) => <ControlledTabs {...args} />,
};

export const Overflowing: Story = {
  args: {
    ...Default.args,
  },
  render: (args) => (
    <div style={{ maxWidth: 320 }}>
      <ControlledTabs {...args} />
    </div>
  ),
};
