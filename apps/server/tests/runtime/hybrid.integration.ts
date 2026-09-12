import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { it } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { HttpStatus } from '@nestjs/common';
import { closeDbConnection, getDb } from '#src/shared/db/postgres';
import { ERROR_CASES } from './fixtures/error-cases.js';
import { type ExportedSpan, verifyQueryComposition } from './query-composition.js';

const DEADLINE_MS = 15_000;
const POLL_MS = 25;
const SUBSCRIPTIONS_PATH = '/api/v1/newsletter/subscriptions';

async function waitUntil(check: () => boolean | Promise<boolean>, label: string) {
  const deadline = Date.now() + DEADLINE_MS;
  while (Date.now() < deadline) {
    if (await check()) return;
    await setTimeout(POLL_MS);
  }
  assert.fail(`Timed out waiting for ${label}`);
}

it('exports related HTTP, Fastify, Nest and action spans and drains an in-flight subscription before closing the pool', {
  timeout: 60_000,
}, async () => {
  const spans: ExportedSpan[] = [];
  const collector = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const payload = JSON.parse(Buffer.concat(chunks).toString()) as {
      resourceSpans: { scopeSpans: { spans: ExportedSpan[] }[] }[];
    };
    spans.push(
      ...payload.resourceSpans.flatMap((resource) =>
        resource.scopeSpans.flatMap((scope) => scope.spans),
      ),
    );
    response.writeHead(HttpStatus.OK, { 'content-type': 'application/json' }).end('{}');
  });
  collector.listen(0, '127.0.0.1');
  await once(collector, 'listening');
  const address = collector.address();
  assert.ok(address && typeof address !== 'string');
  const child = fork(new URL('./fixtures/hybrid.js', import.meta.url), [], {
    execArgv: [
      '--enable-source-maps',
      '--import',
      'reflect-metadata',
      '--import',
      new URL('../../src/instrumentation.js', import.meta.url).pathname,
    ],
    env: {
      ...process.env,
      LOG_LEVEL: 'debug',
      OTEL_SDK_DISABLED: 'false',
      OTEL_TRACES_EXPORTER: 'otlp',
      OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: 'http/json',
      OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: `http://127.0.0.1:${address.port}/v1/traces`,
      OTEL_BSP_SCHEDULE_DELAY: '100',
      OTEL_METRICS_EXPORTER: 'none',
      OTEL_LOGS_EXPORTER: 'none',
    },
    silent: true,
  });
  let origin: string | undefined;
  let poolCloses = 0;
  let diagnostics = '';
  const lifecycle: string[] = [];
  child.stdout?.on('data', (chunk) => {
    diagnostics += chunk.toString();
  });
  child.stderr?.on('data', (chunk) => {
    diagnostics += chunk.toString();
  });
  child.on('message', (message: { type: string; origin?: string }) => {
    lifecycle.push(message.type);
    if (message.type === 'ready') origin = message.origin;
    if (message.type === 'pool-close') poolCloses += 1;
  });
  const exited = once(child, 'exit');
  const database = getDb();
  const email = `runtime-${randomUUID()}@example.com`;
  const drainEmail = `runtime-${randomUUID()}@example.com`;
  let unlock: (() => void) | undefined;
  let transaction: Promise<unknown> | undefined;
  let cleanupFailures: unknown[] = [];
  try {
    await waitUntil(() => {
      assert.equal(child.exitCode, null, diagnostics);
      return Boolean(origin);
    }, 'application startup');
    const correlationId = randomUUID();
    const authorization = `Bearer ${randomUUID()}`;
    const subscribe = (address: string) =>
      fetch(`${origin}${SUBSCRIPTIONS_PATH}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'request-id': correlationId, authorization },
        body: JSON.stringify({ email: address }),
        signal: AbortSignal.timeout(DEADLINE_MS),
      });
    const response = await subscribe(email);
    assert.equal(response.status, HttpStatus.OK, await response.text());
    await waitUntil(
      () => spans.some((span) => span.name === 'newsletter/subscribed'),
      'exported action spans',
    );
    const command = spans.find((span) => span.name === 'newsletter/subscribe');
    const event = spans.find((span) => span.name === 'newsletter/subscribed');
    assert.ok(command && event);
    await waitUntil(
      () =>
        spans.some(
          (span) => span.name === `POST ${SUBSCRIPTIONS_PATH}` && span.traceId === command.traceId,
        ),
      'complete request export',
    );
    assert.equal(event.parentSpanId, command.spanId);
    for (const action of [command, event]) {
      assert.equal(
        action.attributes.find((attribute) => attribute.key === 'cqrs.correlation_id')?.value
          .stringValue,
        correlationId,
      );
    }
    const ancestors: ExportedSpan[] = [];
    let parent = command.parentSpanId;
    while (parent) {
      const span = spans.find((candidate) => candidate.spanId === parent);
      assert.ok(span, `Missing parent ${parent}; exported spans: ${JSON.stringify(spans)}`);
      ancestors.push(span);
      parent = span.parentSpanId;
    }
    assert.ok(
      ancestors.some((span) => span.name === 'SubscribeController.subscribe'),
      JSON.stringify(ancestors),
    );
    assert.ok(
      ancestors.some((span) =>
        span.attributes.some((attribute) => attribute.key === 'fastify.root'),
      ),
      JSON.stringify(ancestors),
    );
    assert.ok(
      ancestors.some((span) => span.name === `POST ${SUBSCRIPTIONS_PATH}`),
      JSON.stringify(ancestors),
    );
    assert.ok(ancestors.every((span) => span.traceId === command.traceId));

    const invalid = await subscribe('not-an-email');
    assert.equal(invalid.status, HttpStatus.BAD_REQUEST);
    const invalidBody = await invalid.json();
    assert.equal(invalidBody.correlationId, correlationId);
    assert.equal(invalidBody.message, 'Validation error');
    assert.equal(invalidBody.subErrors[0].path, '/email');
    assert.equal(invalidBody.details, undefined);
    const domain = await subscribe(ERROR_CASES.domainEmail);
    assert.equal(domain.status, HttpStatus.BAD_REQUEST);
    const domainBody = await domain.json();
    assert.equal(domainBody.message, ERROR_CASES.domainMessage);
    assert.deepEqual(domainBody.details, { reason: 'test-domain-outcome' });
    assert.equal(domainBody.subErrors, undefined);
    const unexpected = await subscribe(ERROR_CASES.unexpectedEmail);
    assert.equal(unexpected.status, HttpStatus.INTERNAL_SERVER_ERROR);
    const unexpectedBody = await unexpected.json();
    assert.equal(unexpectedBody.message, 'Internal Server Error');
    assert.equal(unexpectedBody.details, undefined);
    assert.equal(unexpectedBody.subErrors, undefined);
    assert.ok(!JSON.stringify(unexpectedBody).includes(ERROR_CASES.privateMessage));
    await waitUntil(() => diagnostics.includes(ERROR_CASES.privateMessage), 'error log');
    const records = diagnostics
      .split('\n')
      .filter((line) => line.startsWith('{'))
      .map((line) => JSON.parse(line));
    assert.ok(
      records.some(
        (record) => record.level === 40 && record.err?.message === ERROR_CASES.domainMessage,
      ),
    );
    assert.ok(
      records.some(
        (record) => record.level === 50 && record.err?.message === ERROR_CASES.privateMessage,
      ),
    );
    assert.ok(!diagnostics.includes(authorization));
    assert.ok(
      records.some((record) => record.msg?.startsWith('Action newsletter/subscribe took ')),
    );
    assert.ok(
      records.some((record) =>
        record.msg?.startsWith('Event newsletter/subscribed publication took '),
      ),
    );

    // Hold the actual INSERT in PostgreSQL, not a mocked handler or close hook.
    assert.ok(origin);
    await verifyQueryComposition(origin, spans, () => diagnostics);
    let locked = false;
    const release = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    transaction = database.begin(async (sql) => {
      await sql`LOCK TABLE subscribers IN ACCESS EXCLUSIVE MODE`;
      locked = true;
      await release;
    });
    await waitUntil(() => locked, 'subscriber table lock');
    const pending = subscribe(drainEmail);
    await waitUntil(async () => {
      const rows =
        await database`SELECT pid FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND query LIKE '%INSERT INTO subscribers%'`;
      return rows.length > 0;
    }, 'in-flight database insert');
    child.kill('SIGTERM');
    await setTimeout(POLL_MS * 4);
    assert.equal(child.exitCode, null, 'shutdown must wait for the active request');
    assert.equal(poolCloses, 0, 'the pool must remain open while a request is active');
    assert.ok(unlock);
    unlock();
    await transaction;
    const drained = await pending;
    assert.equal(drained.status, HttpStatus.OK, await drained.text());
    try {
      await waitUntil(() => child.exitCode !== null || child.signalCode !== null, 'graceful exit');
    } catch (error) {
      throw new Error(JSON.stringify({ lifecycle, diagnostics }), { cause: error });
    }
    const [code, signal] = await exited;
    assert.equal(code, 0, diagnostics);
    assert.equal(signal, null);
    assert.equal(poolCloses, 1);
    const subscribers = await database`SELECT email FROM subscribers WHERE email = ${drainEmail}`;
    assert.equal(subscribers.length, 1);
  } finally {
    unlock?.();
    const results = await Promise.allSettled([
      transaction,
      (async () => {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
        await exited;
      })(),
    ]);
    results.push(
      ...(await Promise.allSettled([
        database`DELETE FROM subscribers WHERE email IN (${email}, ${drainEmail})`,
      ])),
    );
    results.push(
      ...(await Promise.allSettled([
        closeDbConnection(),
        new Promise<void>((resolve, reject) =>
          collector.close((error) => (error ? reject(error) : resolve())),
        ),
      ])),
    );
    cleanupFailures = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);
  }
  if (cleanupFailures.length > 0)
    throw new AggregateError(cleanupFailures, 'Hybrid fixture cleanup failed');
});
