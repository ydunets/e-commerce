import { Query } from '@nestjs/cqrs';
import type { SpecificationEntity } from '#src/modules/specification/domain/specification.types';
import type { Meta } from '#src/shared/cqrs/action.types';

export type ListSpecificationsResult = SpecificationEntity[];

export class ListSpecificationsQuery extends Query<ListSpecificationsResult> {
  static readonly type = 'specification/list-all';
  readonly type = ListSpecificationsQuery.type;

  constructor(readonly meta?: Meta) {
    super();
  }
}
