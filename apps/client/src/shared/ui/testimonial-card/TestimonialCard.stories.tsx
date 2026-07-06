import type { Meta, StoryObj } from '@storybook/react';
import avatar from './profile-thumbnail.png';
import { TestimonialCard } from './TestimonialCard';

const meta = {
  title: 'Shared/TestimonialCard',
  component: TestimonialCard,
} satisfies Meta<typeof TestimonialCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    authorName: 'Sarah Dole',
    authorUsername: 'sarahdole',
    authorImage: avatar,
    testimonialText:
      "I've been searching for high-quality abstract wallpapers for months. This hoodie is even better in person — the fabric feels premium and the fit is perfect.",
  },
};
