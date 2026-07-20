import type { SpecificationResponseDto } from '@e-commerce/contracts';
import { apiGet } from '@/shared/api';
import type { Specification } from '../model/types';

export async function getSpecifications(
  baseUrl = '',
): Promise<Specification[]> {
  const data = await apiGet<SpecificationResponseDto[]>(
    '/v1/specifications',
    baseUrl,
  );

  return data.map((specification) => ({
    id: specification.specification_id,
    label: specification.label,
    title: specification.title,
    description: specification.description,
    imageUrl: specification.image_url,
    imageAlt: specification.image_alt,
    features: specification.features,
  }));
}
