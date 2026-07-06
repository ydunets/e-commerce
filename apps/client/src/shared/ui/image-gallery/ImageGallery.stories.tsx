import type { Meta, StoryObj } from '@storybook/react';
import { ImageGallery } from './ImageGallery';

const meta = {
  title: 'Shared/ImageGallery',
  component: ImageGallery,
} satisfies Meta<typeof ImageGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    images: [
      'https://picsum.photos/seed/gallery-a/800',
      'https://picsum.photos/seed/gallery-b/800',
      'https://picsum.photos/seed/gallery-c/800',
    ],
    alt: 'Voyager Hoodie',
  },
};

export const SingleImage: Story = {
  args: {
    images: ['https://picsum.photos/seed/gallery-a/800'],
    alt: 'Voyager Hoodie',
  },
};
