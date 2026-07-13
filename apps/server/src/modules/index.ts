import { asValue } from 'awilix';
import type { FastifyBaseLogger } from 'fastify';
import type postgres from 'postgres';
import type { CommandBus, EventBus, QueryBus } from '#src/shared/cqrs/bus.types.ts';
import { getDb } from '#src/shared/db/postgres.ts';

declare global {
  export interface Dependencies {
    logger: FastifyBaseLogger;
    db: ReturnType<typeof postgres>;
    queryBus: QueryBus;
    commandBus: CommandBus;
    eventBus: EventBus;
  }
}

export function makeDependencies({
  logger,
  queryBus,
  commandBus,
  eventBus,
}: {
  logger: FastifyBaseLogger;
  queryBus: QueryBus;
  commandBus: CommandBus;
  eventBus: EventBus;
}) {
  const db = getDb();
  return {
    logger: asValue(logger),
    db: asValue(db),
    queryBus: asValue(queryBus),
    commandBus: asValue(commandBus),
    eventBus: asValue(eventBus),
  };
}
