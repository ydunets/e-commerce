import {
  SUBSCRIBER_REPOSITORY,
  type SubscriberRepository,
} from '#src/modules/newsletter/database/subscriber.repository.port';
import createServer from '#src/server/index';
import { getDb } from '#src/shared/db/postgres';
import { ArgumentInvalidException } from '#src/shared/exceptions/exceptions';
import { ERROR_CASES } from './error-cases.js';

// Observe the real pool boundary without replacing query execution or shutdown.
const database = getDb();
const end = database.end.bind(database);
database.end = async (options) => {
  process.send?.({ type: 'pool-close' });
  await end(options);
};
const app = await createServer();
// Exercise the shared HTTP error boundary at its approved repository seam.
const repository = app.get<SubscriberRepository>(SUBSCRIBER_REPOSITORY);
const insert = repository.insert.bind(repository);
repository.insert = async (subscriber) => {
  if (subscriber.email === ERROR_CASES.domainEmail) {
    throw new ArgumentInvalidException(ERROR_CASES.domainMessage, undefined, {
      reason: 'test-domain-outcome',
    });
  }
  if (subscriber.email === ERROR_CASES.unexpectedEmail) throw new Error(ERROR_CASES.privateMessage);
  await insert(subscriber);
};
app.enableShutdownHooks(['SIGTERM', 'SIGINT'], { useProcessExit: true });
await app.listen(0, '127.0.0.1');
process.send?.({ type: 'ready', origin: await app.getUrl() });
