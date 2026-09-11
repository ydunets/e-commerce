import type { SpecificationEntity } from '#src/modules/specification/domain/specification.types';
import { specificationActionCreator } from '#src/modules/specification/index';
import type { HandlerAction } from '#src/shared/cqrs/bus.types';

export type ListSpecificationsResult = SpecificationEntity[];

export const listSpecificationsQuery = specificationActionCreator<void, ListSpecificationsResult>(
  'list-all',
);

export default function makeListSpecificationsQuery({
  queryBus,
  specificationRepository,
}: Dependencies) {
  return {
    async handler(
      _query: HandlerAction<typeof listSpecificationsQuery>,
    ): Promise<ListSpecificationsResult> {
      return specificationRepository.findAll();
    },
    init() {
      queryBus.register(listSpecificationsQuery.type, this.handler);
    },
  };
}
