import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog } from './Dialog';

const meta = {
  title: 'Shared/Dialog',
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { open: true, label: 'Example dialog', onClose: () => {} },
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)}>
          <div className="p-10">
            <h2 className="text-2xl font-semibold text-ink">Dialog title</h2>
            <p className="mt-2 text-muted">
              Dismiss with Esc, a backdrop click, or the ✕ button — all route
              through onClose.
            </p>
          </div>
        </Dialog>
      </>
    );
  },
};
