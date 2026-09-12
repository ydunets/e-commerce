import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  SPECIFICATION_REPOSITORY,
  type SpecificationRepository,
} from '#src/modules/specification/database/specification.repository.port';
import {
  ListSpecificationsQuery,
  type ListSpecificationsResult,
} from './list-specifications.query.js';

@QueryHandler(ListSpecificationsQuery)
export class ListSpecificationsHandler implements IQueryHandler<ListSpecificationsQuery> {
  constructor(
    @Inject(SPECIFICATION_REPOSITORY) private readonly repository: SpecificationRepository,
  ) {}

  execute(_query: ListSpecificationsQuery): Promise<ListSpecificationsResult> {
    return this.repository.findAll();
  }
}
