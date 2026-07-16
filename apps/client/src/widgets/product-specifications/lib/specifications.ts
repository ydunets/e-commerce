import type { ComponentType, SVGProps } from 'react';
import {
  ColorFilterLineIcon,
  HandHeartLineIcon,
  InfinityFillIcon,
  PaintLineIcon,
  PlantLineIcon,
  PriceTag2LineIcon,
  RainbowLineIcon,
  RecycleLineIcon,
  Scales2LineIcon,
  ShapesLineIcon,
  ShieldStarLineIcon,
  ShirtLineIcon,
  StackLineIcon,
  TShirtLineIcon,
  WaterFlashLineIcon,
  WindyLineIcon,
} from '../ui/icons';

export type TSpecificationFeature = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
};

export type TSpecification = {
  id: string;
  tab: string;
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  features: TSpecificationFeature[];
};

export const SPECIFICATIONS: TSpecification[] = [
  {
    id: 'sustainability',
    tab: 'Sustainability',
    image: '/images/specifications/sustainability.jpg',
    imageAlt:
      'Woman hiding her face behind the rolled collar of a yellow cashmere sweater',
    title: 'Eco-Friendly Choice',
    description:
      'With our sustainable approach, we curate clothing that makes a statement of care—care for the planet, and for the art of fashion.',
    features: [
      { icon: RecycleLineIcon, label: 'Recycled Materials' },
      { icon: PaintLineIcon, label: 'Low Impact Dye' },
      { icon: PlantLineIcon, label: 'Carbon Neutral' },
      { icon: WaterFlashLineIcon, label: 'Water Conservation' },
    ],
  },
  {
    id: 'comfort',
    tab: 'Comfort',
    image: '/images/specifications/comfort.jpg',
    imageAlt: 'Close-up of softly draped charcoal fabric',
    title: 'Uncompromised Comfort',
    description:
      'Our garments are a sanctuary of softness, tailored to drape gracefully and allow for freedom of movement.',
    features: [
      { icon: TShirtLineIcon, label: 'Ergonomic Fits' },
      { icon: HandHeartLineIcon, label: 'Soft-to-the-Touch Fabrics' },
      { icon: WindyLineIcon, label: 'Breathable Weaves' },
      { icon: ColorFilterLineIcon, label: 'Thoughtful Design' },
    ],
  },
  {
    id: 'durability',
    tab: 'Durability',
    image: '/images/specifications/durability.jpg',
    imageAlt: 'Stack of neatly folded knitwear resting on a white chair',
    title: 'Built to Last',
    description:
      'Here’s to apparel that you can trust to look as good as new, wear after wear, year after year.',
    features: [
      { icon: StackLineIcon, label: 'Reinforced Construction' },
      { icon: Scales2LineIcon, label: 'Quality Control' },
      { icon: ShieldStarLineIcon, label: 'Material Resilience' },
      { icon: PriceTag2LineIcon, label: 'Warranty and Repair' },
    ],
  },
  {
    id: 'versatility',
    tab: 'Versatility',
    image: '/images/specifications/versatility.jpg',
    imageAlt:
      'Rack of neutral-toned garments hanging beside stems of dried pampas grass',
    title: 'Versatile by Design',
    description:
      'Our pieces are a celebration of versatility, offering a range of styles that are as perfect for a business meeting as they are for a casual brunch.',
    features: [
      { icon: RainbowLineIcon, label: 'Adaptive Styles' },
      { icon: ShirtLineIcon, label: 'Functional Fashion' },
      { icon: InfinityFillIcon, label: 'Timeless Aesthetics' },
      { icon: ShapesLineIcon, label: 'Mix-and-Match Potential' },
    ],
  },
];
