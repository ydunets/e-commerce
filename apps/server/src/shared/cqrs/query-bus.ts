import type { QueryBus } from '#src/shared/cqrs/bus.types';
import { createRequestBus } from '#src/shared/cqrs/request-bus';

export function queryBus(): QueryBus {
  return createRequestBus('Query');
}
