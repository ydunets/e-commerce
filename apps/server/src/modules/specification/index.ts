import type { SpecificationRepository } from '#src/modules/specification/database/specification.repository.port.ts';
import type { SpecificationMapper } from '#src/modules/specification/specification.mapper.ts';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';

declare global {
  export interface Dependencies {
    specificationMapper: SpecificationMapper;
    specificationRepository: SpecificationRepository;
  }
}

export const specificationActionCreator = actionCreatorFactory('specification');
