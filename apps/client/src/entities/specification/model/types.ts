import type { SpecificationIconDto } from '@e-commerce/contracts';

export type SpecificationIcon = SpecificationIconDto;

export interface SpecificationFeature {
  icon: SpecificationIcon;
  label: string;
}

export interface Specification {
  id: string;
  /** Tab label shown in the specifications tab list. */
  label: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  features: SpecificationFeature[];
}
