import type { SpecificationRepository } from '#src/modules/specification/database/specification.repository.port.ts';
import type {
  SpecificationEntity,
  SpecificationFeature,
} from '#src/modules/specification/domain/specification.types.ts';

interface SpecificationRow {
  specification_id: string;
  label: string;
  title: string;
  description: string;
  image_url: string;
  image_alt: string;
  sort_order: number;
}

interface FeatureRow {
  specification_id: string;
  icon: SpecificationFeature['icon'];
  label: string;
  sort_order: number;
}

const bySortOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

export default function specificationRepository({ db }: Dependencies): SpecificationRepository {
  return {
    async findAll(): Promise<SpecificationEntity[]> {
      const specifications: SpecificationRow[] =
        await db`SELECT specification_id, label, title, description, image_url, image_alt, sort_order FROM specifications`;
      const features: FeatureRow[] =
        await db`SELECT specification_id, icon, label, sort_order FROM specification_features`;

      return specifications.toSorted(bySortOrder).map((specification) => ({
        id: specification.specification_id,
        label: specification.label,
        title: specification.title,
        description: specification.description,
        imageUrl: specification.image_url,
        imageAlt: specification.image_alt,
        features: features
          .filter((feature) => feature.specification_id === specification.specification_id)
          .toSorted(bySortOrder)
          .map((feature) => ({ icon: feature.icon, label: feature.label })),
      }));
    },
  };
}
