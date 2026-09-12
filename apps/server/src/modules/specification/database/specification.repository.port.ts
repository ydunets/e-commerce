import type { SpecificationEntity } from '#src/modules/specification/domain/specification.types';

export const SPECIFICATION_REPOSITORY = Symbol('SpecificationRepository');

export interface SpecificationRepository {
  findAll(): Promise<SpecificationEntity[]>;
}
