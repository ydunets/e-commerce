import type { Product } from './types';

/** Realistic offline stand-in for the API's voyager-hoodie payload. */
export const productFixture: Product = {
  id: 'voyager-hoodie',
  name: 'Voyager Hoodie',
  description:
    'The Voyager Hoodie is for the explorer at heart. Its durable fabric and roomy pockets are perfect for those who are always searching for the next adventure.',
  colors: ['green', 'brown'],
  variants: [
    {
      sku: 'vh-green-sm',
      color: 'green',
      size: 'sm',
      price: { sale: 76, list: 95, discountPercentage: 20 },
      stock: 10,
      sold: 40,
    },
    {
      sku: 'vh-green-md',
      color: 'green',
      size: 'md',
      price: { sale: 76, list: 95, discountPercentage: 20 },
      stock: 0,
      sold: 60,
    },
    {
      sku: 'vh-brown-sm',
      color: 'brown',
      size: 'sm',
      price: { sale: 95, list: 95, discountPercentage: null },
      stock: 4,
      sold: 12,
    },
    {
      sku: 'vh-brown-md',
      color: 'brown',
      size: 'md',
      price: { sale: 95, list: 95, discountPercentage: null },
      stock: 7,
      sold: 5,
    },
  ],
  images: [
    { color: 'green', url: 'https://picsum.photos/seed/vh-green/800' },
    { color: 'green', url: 'https://picsum.photos/seed/vh-green-b/800' },
    { color: 'brown', url: 'https://picsum.photos/seed/vh-brown/800' },
  ],
  info: [
    {
      title: 'Features',
      description: ['Relaxed fit', 'Two-way zipper', 'Adjustable hood'],
    },
    {
      title: 'Fabric & Care',
      description: ['80% organic cotton', 'Machine wash cold'],
    },
  ],
  reviews: { count: 62, average: 4.4 },
};
