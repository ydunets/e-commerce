import type { FastifyBaseLogger } from 'fastify';
import type { TraceableAction } from '#src/shared/cqrs/action.types';

export function makeTrackExecutionTime(logger: FastifyBaseLogger) {
  return async function trackExecutionTime<ActionType extends TraceableAction, Result>(
    action: ActionType,
    handler: (action: ActionType) => Promise<Result>,
  ): Promise<Result> {
    const startTime = performance.now();
    const result = await handler(action);
    const endTime = performance.now();
    logger.debug(
      `Action ${action.type} took ${(endTime - startTime).toFixed(2)}ms of execution time.`,
    );
    return result;
  };
}
