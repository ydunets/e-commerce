import type { Meta, StoryObj } from '@storybook/react';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { media } from '@/shared/lib/breakpoints.stylex';
import { withRouter } from '@/shared/lib/storybookRouter';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/text-input';
import { Footer } from './Footer';

const styles = stylex.create({
  form: {
    display: 'flex',
    width: '100%',
    flexDirection: { default: 'column', [media.md]: 'row' },
    alignItems: { default: null, [media.md]: 'flex-start' },
    gap: '1rem',
  },
  field: { flexGrow: 1, flexShrink: 1, flexBasis: '0%' },
});

// A presentational stand-in for the NewsletterForm widget: the shared UI
// layer (and its stories) stays free of widget imports, per the Footer's
// slot design.
const NewsletterSlotPlaceholder = () => {
  const [email, setEmail] = useState('');

  return (
    <form {...stylex.props(styles.form)}>
      <TextInput
        style={styles.field}
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
