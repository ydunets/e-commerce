import type { Specification } from './types';

/** Realistic offline stand-in for the API's specifications payload. */
export const specificationsFixture: Specification[] = [
  {
    id: 'sustainability',
    label: 'Sustainability',
    title: 'Eco-Friendly Choice',
    description:
      'With our sustainable approach, we curate clothing that makes a statement of care—care for the planet, and for the art of fashion.',
    imageUrl: '/images/specifications/sustainability.jpg',
    imageAlt:
      'Woman hiding her face behind the rolled collar of a yellow cashmere sweater',
    features: [
      { icon: 'recycle-line', label: 'Recycled Materials' },
      { icon: 'paint-line', label: 'Low Impact Dye' },
      { icon: 'plant-line', label: 'Carbon Neutral' },
      { icon: 'water-flash-line', label: 'Water Conservation' },
    ],
  },
  {
    id: 'comfort',
    label: 'Comfort',
    title: 'Uncompromised Comfort',
    description:
      'Our garments are a sanctuary of softness, tailored to drape gracefully and allow for freedom of movement.',
    imageUrl: '/images/specifications/comfort.jpg',
    imageAlt: 'Close-up of softly draped charcoal fabric',
    features: [
      { icon: 't-shirt-line', label: 'Ergonomic Fits' },
      { icon: 'hand-heart-line', label: 'Soft-to-the-Touch Fabrics' },
      { icon: 'windy-line', label: 'Breathable Weaves' },
      { icon: 'color-filter-line', label: 'Thoughtful Design' },
    ],
  },
  {
    id: 'durability',
    label: 'Durability',
    title: 'Built to Last',
    description:
      'Here’s to apparel that you can trust to look as good as new, wear after wear, year after year.',
    imageUrl: '/images/specifications/durability.jpg',
    imageAlt: 'Stack of neatly folded knitwear resting on a white chair',
    features: [
      { icon: 'stack-line', label: 'Reinforced Construction' },
      { icon: 'scales-2-line', label: 'Quality Control' },
      { icon: 'shield-star-line', label: 'Material Resilience' },
      { icon: 'price-tag-2-line', label: 'Warranty and Repair' },
    ],
  },
  {
    id: 'versatility',
    label: 'Versatility',
    title: 'Versatile by Design',
    description:
      'Our pieces are a celebration of versatility, offering a range of styles that are as perfect for a business meeting as they are for a casual brunch.',
    imageUrl: '/images/specifications/versatility.jpg',
    imageAlt:
      'Rack of neutral-toned garments hanging beside stems of dried pampas grass',
    features: [
      { icon: 'rainbow-line', label: 'Adaptive Styles' },
      { icon: 'shirt-line', label: 'Functional Fashion' },
      { icon: 'infinity-fill', label: 'Timeless Aesthetics' },
      { icon: 'shapes-line', label: 'Mix-and-Match Potential' },
    ],
  },
];
