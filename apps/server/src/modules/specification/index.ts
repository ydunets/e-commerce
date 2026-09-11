import type { SpecificationRepository } from '#src/modules/specification/database/specification.repository.port';
import type { SpecificationMapper } from '#src/modules/specification/specification.mapper';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator';

declare global {
  export interface Dependencies {
    specificationMapper: SpecificationMapper;
    specificationRepository: SpecificationRepository;
  }
}

export const specificationActionCreator = actionCreatorFactory('specification');
