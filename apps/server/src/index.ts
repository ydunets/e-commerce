import { env } from '#src/config/index';
import createServer from '#src/server/index';

const app = await createServer();
app.enableShutdownHooks(['SIGTERM', 'SIGINT'], { useProcessExit: true });
try {
  await app.listen(env.server.port, env.server.host);
} catch (error) {
  app.getHttpAdapter().getInstance().log.error(error);
  await app.close();
  process.exitCode = 1;
}
