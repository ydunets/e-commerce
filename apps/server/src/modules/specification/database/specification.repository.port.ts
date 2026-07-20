import type { SpecificationEntity } from '#src/modules/specification/domain/specification.types.ts';

export interface SpecificationRepository {
  findAll(): Promise<SpecificationEntity[]>;
}
