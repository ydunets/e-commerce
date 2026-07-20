import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Tabs, type TTabsProps, tabButtonId, tabPanelId } from './Tabs';

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
    <>
      <Tabs
        {...args}
        activeId={activeId}
        onChange={(next) => {
          args.onChange(next);
          setActiveId(next);
        }}
      />
      {args.tabs.map((tab) => (
        <div
          key={tab.id}
          id={tabPanelId(args.idPrefix, tab.id)}
          role="tabpanel"
          aria-labelledby={tabButtonId(args.idPrefix, tab.id)}
          hidden={tab.id !== activeId}
          className="p-4 text-muted"
        >
          {tab.label} content
        </div>
      ))}
    </>
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
