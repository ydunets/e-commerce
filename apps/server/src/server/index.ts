import path from 'node:path';
import AutoLoad from '@fastify/autoload';
import Cors from '@fastify/cors';
import Helmet from '@fastify/helmet';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import UnderPressure from '@fastify/under-pressure';
import type { FastifyInstance } from 'fastify';
import env from '#src/config/env.ts';
import { di } from '#src/server/di/index.ts';

export default async function createServer(fastify: FastifyInstance) {
  // Set sensible default security headers
  await fastify.register(Helmet, {
    global: true,
    contentSecurityPolicy: !env.isDevelopment,
    crossOriginEmbedderPolicy: !env.isDevelopment,
  });

  // Enables the use of CORS in a Fastify application.
  // https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
  // `origin: false` disables CORS headers entirely (suitable for same-origin / server-to-server).
  // Set to `true` or a specific origin string/array for cross-origin frontends.
  await fastify.register(Cors, {
    origin: false,
  });

  // Auto-load plugins
  await fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, 'plugins'),
    dirNameRoutePrefix: false,
  });

  // Configure Dependency Injection
  await di(fastify);

  // Auto-load routes
  await fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, '../modules'),
    dirNameRoutePrefix: false,
    options: {
      prefix: '/api',
    },
    matchFilter: (path) => /\.(route|resolver)\.ts$/.test(path),
  });

  await fastify.register(UnderPressure, {
    healthCheck: async () => {
      await fastify.diContainer.cradle.db`SELECT 1`;
      return true;
    },
    healthCheckInterval: 5000,
    exposeStatusRoute: {
      routeOpts: { logLevel: 'silent' },
      url: '/health',
    },
  });

  return fastify.withTypeProvider<TypeBoxTypeProvider>();
}
