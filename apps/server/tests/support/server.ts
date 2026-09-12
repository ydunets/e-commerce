import Fastify from 'fastify';
import server from '../../src/server/index.js';

export const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: 'warn',
    },
    disableRequestLogging: true,
    routerOptions: {
      ignoreDuplicateSlashes: true,
    },
  });

  return server(app);
};
