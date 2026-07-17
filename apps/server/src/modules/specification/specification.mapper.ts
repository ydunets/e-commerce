import type { SpecificationEntity } from '#src/modules/specification/domain/specification.types.ts';
import type { SpecificationResponseDto } from '#src/modules/specification/dtos/specification.response.dto.ts';

export interface SpecificationMapper {
  toResponse(entity: SpecificationEntity): SpecificationResponseDto;
}

export default function specificationMapper(): SpecificationMapper {
  return {
    toResponse(entity: SpecificationEntity): SpecificationResponseDto {
      return {
        specification_id: entity.id,
        label: entity.label,
        title: entity.title,
        description: entity.description,
        image_url: entity.imageUrl,
        image_alt: entity.imageAlt,
        features: entity.features.map((feature) => ({ icon: feature.icon, label: feature.label })),
      };
    },
  };
}
