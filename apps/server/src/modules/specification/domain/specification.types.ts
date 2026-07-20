import type { SpecificationIconDto } from '@e-commerce/contracts';

export interface SpecificationFeature {
  icon: SpecificationIconDto;
  label: string;
}

export interface SpecificationEntity {
  id: string;
  label: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  features: SpecificationFeature[];
}
