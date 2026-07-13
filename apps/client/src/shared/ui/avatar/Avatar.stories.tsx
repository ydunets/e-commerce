import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
  title: 'Shared/Avatar',
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {
    name: 'Kimberly Mastrangelo',
    src: 'https://vaqybtnqyonvlwtskzmv.supabase.co/storage/v1/object/public/e-commerce-track-images/user-avatars/kimberly-mastrangelo.jpg',
    size: 48,
  },
};

export const InitialsFallback: Story = {
  args: { name: 'Natali Craig', src: null, size: 48 },
};

export const SingleName: Story = {
  args: { name: 'Cher', src: null, size: 48 },
};
