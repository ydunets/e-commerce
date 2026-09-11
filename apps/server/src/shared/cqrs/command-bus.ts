import type { CommandBus } from '#src/shared/cqrs/bus.types';
import { createRequestBus } from '#src/shared/cqrs/request-bus';

export function commandBus(): CommandBus {
  return createRequestBus('Command');
}
