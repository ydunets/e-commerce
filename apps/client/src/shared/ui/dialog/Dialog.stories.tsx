import type { Meta, StoryObj } from '@storybook/react';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Button } from '@/shared/ui/button';
import { colors } from '@/shared/ui/tokens.stylex';
import { Dialog } from './Dialog';

const styles = stylex.create({
  body: { padding: '2.5rem' },
  title: {
    fontSize: '1.5rem',
    lineHeight: '2rem',
    fontWeight: 600,
    color: colors.ink,
  },
  copy: { marginTop: '0.5rem', color: colors.muted },
});

const meta = {
  title: 'Shared/Dialog',
  component: Dialog,
  args: { onClose: fn() },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { open: true, label: 'Example dialog' },
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Dialog
          {...args}
          open={open}
          onClose={() => {
            args.onClose();
            setOpen(false);
          }}
        >
          <div {...stylex.props(styles.body)}>
            <h2 {...stylex.props(styles.title)}>Dialog title</h2>
            <p {...stylex.props(styles.copy)}>
              Dismiss with Esc, a backdrop click, or the ✕ button — all route
              through onClose.
            </p>
          </div>
        </Dialog>
      </>
    );
  },
};
