import type { SpecificationEntity } from '#src/modules/specification/domain/specification.types';

export interface SpecificationRepository {
  findAll(): Promise<SpecificationEntity[]>;
}
