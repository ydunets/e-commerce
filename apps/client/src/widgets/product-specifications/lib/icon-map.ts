import type { ComponentType, SVGProps } from 'react';
import type { SpecificationIcon } from '@/entities/specification';
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

export const SPECIFICATION_ICON_MAP: Record<
  SpecificationIcon,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  'recycle-line': RecycleLineIcon,
  'paint-line': PaintLineIcon,
  'plant-line': PlantLineIcon,
  'water-flash-line': WaterFlashLineIcon,
  't-shirt-line': TShirtLineIcon,
  'hand-heart-line': HandHeartLineIcon,
  'windy-line': WindyLineIcon,
  'color-filter-line': ColorFilterLineIcon,
  'stack-line': StackLineIcon,
  'scales-2-line': Scales2LineIcon,
  'shield-star-line': ShieldStarLineIcon,
  'price-tag-2-line': PriceTag2LineIcon,
  'rainbow-line': RainbowLineIcon,
  'shirt-line': ShirtLineIcon,
  'infinity-fill': InfinityFillIcon,
  'shapes-line': ShapesLineIcon,
};

export function getSpecificationIcon(
  icon: SpecificationIcon,
): ComponentType<SVGProps<SVGSVGElement>> | undefined {
  return SPECIFICATION_ICON_MAP[icon];
}
