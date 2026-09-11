import { Inject, Injectable } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Command, CommandBus, EventBus } from '@nestjs/cqrs';
import type { FastifyInstance } from 'fastify';
import { getRequestId } from '#src/shared/app/app-request-context';
import type { TraceableAction } from '#src/shared/cqrs/bus.types';
import { makeTrackExecutionTime } from '#src/shared/cqrs/middlewares';
import { makeTracingMiddleware, traceEventMiddleware } from '#src/shared/cqrs/otel-middleware';

export type ApplicationAction = TraceableAction;

function withMetadata<Action extends ApplicationAction>(action: Action): Action {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action, {
    meta: {
      ...action.meta,
      correlationId: action.meta?.correlationId ?? getRequestId(),
      timestamp: action.meta?.timestamp ?? Date.now(),
    },
  });
}

@Injectable()
export class ApplicationDispatcher {
  constructor(
    @Inject(CommandBus) private readonly commands: Pick<CommandBus, 'execute'>,
    @Inject(EventBus) private readonly events: Pick<EventBus, 'publish'>,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  execute<Result>(command: Command<Result> & ApplicationAction): Promise<Result> {
    const logger = this.adapterHost.httpAdapter.getInstance<FastifyInstance>().log;
    return makeTracingMiddleware('command')(withMetadata(command), (action) =>
      makeTrackExecutionTime(logger)(action, (enriched) => this.commands.execute(enriched)),
    );
  }

  publish(event: ApplicationAction): void {
    traceEventMiddleware(withMetadata(event), (enriched) => {
      const started = performance.now();
      try {
        this.events.publish(enriched);
      } finally {
        // Time publication only, without promising subscriber completion.
        this.adapterHost.httpAdapter
          .getInstance<FastifyInstance>()
          .log.debug(
            `Event ${enriched.type} publication took ${(performance.now() - started).toFixed(2)}ms.`,
          );
      }
    });
  }
}
