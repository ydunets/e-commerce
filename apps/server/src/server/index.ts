import { randomUUID } from 'node:crypto';
import { isType } from '@e-commerce/contracts';
import Cors from '@fastify/cors';
import Helmet from '@fastify/helmet';
import UnderPressure from '@fastify/under-pressure';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import Fastify, { type FastifyInstance } from 'fastify';
import env from '#src/config/env';
import { closeDbConnection, getDb } from '#src/shared/db/postgres';
import { createValidationPipe } from '#src/shared/nest/validation';
import { AppModule } from './app.module.js';
import requestContext from './plugins/request-context.js';
import { setupDocumentation } from './plugins/swagger.js';

export default async function createServer(
  fastify: FastifyInstance = Fastify({
    logger: {
      level: env.log.level,
      redact: ['headers.authorization', 'req.headers.authorization'],
    },
    genReqId: (request) => {
      const requestId = request.headers['request-id'];
      return isType(requestId, 'string') ? requestId : randomUUID();
    },
    routerOptions: { ignoreDuplicateSlashes: true },
  }),
): Promise<NestFastifyApplication> {
  let closing = false;
  fastify.addHook('preClose', async () => {
    closing = true;
  });
  // An active keep-alive response can finish after server.close's idle sweep.
  // Finish that response normally, then release its connection for shutdown.
  fastify.addHook('onSend', async (_request, reply, payload) => {
    if (closing) reply.header('connection', 'close');
    return payload;
  });
  await fastify.register(Helmet, {
    global: true,
    contentSecurityPolicy: !env.isDevelopment,
    crossOriginEmbedderPolicy: !env.isDevelopment,
  });
  await fastify.register(Cors, { origin: false });
  await fastify.register(requestContext);

  await fastify.register(UnderPressure, {
    healthCheck: async () => {
      await getDb()`SELECT 1`;
      return true;
    },
    healthCheckInterval: 5000,
    exposeStatusRoute: { routeOpts: { logLevel: 'silent' }, url: '/health' },
  });
  fastify.addHook('onClose', async () => {
    await closeDbConnection();
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(fastify),
    {
      logger: false,
      abortOnError: false,
    },
  );
  app.useGlobalPipes(createValidationPipe());
  setupDocumentation(app);
  await app.init();
  await fastify.ready();
  return app;
}
