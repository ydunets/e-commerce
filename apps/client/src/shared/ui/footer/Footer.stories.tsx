import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { withRouter } from '@/shared/lib/storybookRouter';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/text-input';
import { Footer } from './Footer';

// A presentational stand-in for the NewsletterForm widget: the shared UI
// layer (and its stories) stays free of widget imports, per the Footer's
// slot design.
const NewsletterSlotPlaceholder = () => {
  const [email, setEmail] = useState('');

  return (
    <form className="flex w-full flex-col gap-4 md:flex-row md:items-start">
      <TextInput
        className="flex-1"
        label="Email address"
        labelHidden
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={setEmail}
      />
      <Button type="submit">Subscribe</Button>
    </form>
  );
};

const meta = {
  title: 'Shared/Footer',
  component: Footer,
  decorators: [withRouter],
  args: {
    newsletterSlot: <NewsletterSlotPlaceholder />,
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop' } },
};

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet' } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile' } },
};
