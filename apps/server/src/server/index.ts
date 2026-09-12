import { randomUUID } from 'node:crypto';
import path from 'node:path';
import AutoLoad from '@fastify/autoload';
import Cors from '@fastify/cors';
import Helmet from '@fastify/helmet';
import UnderPressure from '@fastify/under-pressure';
import { NestFactory } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import Fastify, { type FastifyInstance } from 'fastify';
import env from '#src/config/env';
import { di } from '#src/server/di/index';
import { apiErrorResponseSchema } from '#src/shared/api/api-error.response';
import type { QueryBus as LegacyQueryBus } from '#src/shared/cqrs/bus.types';
import { closeDbConnection, getDb } from '#src/shared/db/postgres';
import { createValidationPipe } from '#src/shared/nest/validation';
import { AppModule } from './app.module.js';
import { connectInventoryQuery } from './migration/inventory-query.adapter.js';
import cqrs from './plugins/cqrs.js';
import errorHandler from './plugins/error-handler.js';
import requestContext from './plugins/request-context.js';
import swagger from './plugins/swagger.js';

export default async function createServer(
  fastify: FastifyInstance = Fastify({
    logger: {
      level: env.log.level,
      redact: ['headers.authorization', 'req.headers.authorization'],
    },
    genReqId: (request) => (request.headers['request-id'] as string) ?? randomUUID(),
    routerOptions: { ignoreDuplicateSlashes: true },
    ajv: { customOptions: { keywords: ['example'] } },
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
  fastify.addSchema(apiErrorResponseSchema);
  await fastify.register(swagger);

  // The error handler and legacy routes must share this encapsulated scope.
  let legacyQueries: LegacyQueryBus | undefined;
  await fastify.register(async (legacy) => {
    await legacy.register(cqrs);
    await legacy.register(errorHandler);
    await di(legacy);
    legacyQueries = legacy.queryBus;
    await legacy.register(AutoLoad, {
      dir: path.join(import.meta.dirname, '../modules'),
      dirNameRoutePrefix: false,
      options: { prefix: '/api' },
      ignoreFilter: (file) =>
        ['newsletter', 'product', 'review'].some((feature) =>
          file.includes(`${path.sep}${feature}${path.sep}`),
        ),
      matchFilter: (file) => /\.(route|resolver)\.js$/.test(file),
    });
  });
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
  await app.init();
  if (!legacyQueries) throw new Error('Legacy query bus was not initialized');
  connectInventoryQuery(legacyQueries, app.get(QueryBus));
  await fastify.ready();
  return app;
}
