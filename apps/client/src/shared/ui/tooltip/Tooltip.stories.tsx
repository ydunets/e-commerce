import type { Meta, StoryObj } from '@storybook/react';
import * as stylex from '@stylexjs/stylex';
import { colors } from '@/shared/ui/tokens.stylex';
import { Tooltip } from './Tooltip';

const styles = stylex.create({
  // Give the tooltip room to render in the preview.
  stage: {
    display: 'flex',
    height: '10rem',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trigger: {
    borderRadius: '0.5rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.line,
    paddingInline: '1rem',
    paddingBlock: '0.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: colors.ink,
  },
});

const meta = {
  title: 'Shared/Tooltip',
  component: Tooltip,
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
  },
  decorators: [
    (Story) => (
      <div {...stylex.props(styles.stage)}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const Trigger = (
  <button type="button" {...stylex.props(styles.trigger)}>
    Hover or focus me
  </button>
);

export const Top: Story = {
  args: { content: 'Insufficient stock', position: 'top', children: Trigger },
};

export const Bottom: Story = {
  args: { content: 'Added to your bag', position: 'bottom', children: Trigger },
};

export const Right: Story = {
  args: { content: 'Only 2 left', position: 'right', children: Trigger },
};
