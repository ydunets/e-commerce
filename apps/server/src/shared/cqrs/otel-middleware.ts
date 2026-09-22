import { isType } from '@e-commerce/contracts';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import type { TraceableAction } from '#src/shared/cqrs/action.types';

const tracer = trace.getTracer('cqrs');

/**
 * Creates a tracing middleware for the command or query bus.
 * Each execution is wrapped in an OTel span named after the action type.
 * When OTel is disabled the API returns noop spans — zero overhead.
 */
export function makeTracingMiddleware(busType: 'command' | 'query') {
  return async function traceAction<Action extends TraceableAction, Result>(
    action: Action,
    handler: (action: Action) => Promise<Result>,
  ): Promise<Result> {
    return tracer.startActiveSpan(
      action.type,
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'cqrs.bus': busType,
          'cqrs.action': action.type,
        },
      },
      async (span) => {
        const correlationId = action.meta?.correlationId;
        if (isType(correlationId, 'string')) {
          span.setAttribute('cqrs.correlation_id', correlationId);
        }
        try {
          const result = await handler(action);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          if (error instanceof Error) span.recordException(error);
          throw error;
        } finally {
          span.end();
        }
      },
    );
  };
}

/**
 * Event bus tracing middleware.
 * Events are fire-and-forget so the span is recorded synchronously.
 */
export function traceEventMiddleware<Action extends TraceableAction>(
  action: Action,
  handler: (action: Action) => void,
): void {
  tracer.startActiveSpan(
    action.type,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'cqrs.bus': 'event',
        'cqrs.action': action.type,
      },
    },
    (span) => {
      const correlationId = action.meta?.correlationId;
      if (isType(correlationId, 'string')) {
        span.setAttribute('cqrs.correlation_id', correlationId);
      }
      try {
        handler(action);
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        if (error instanceof Error) span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    },
  );
}
