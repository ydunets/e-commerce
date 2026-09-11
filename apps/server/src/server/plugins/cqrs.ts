import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyCqrs from '../../shared/cqrs/index.js';

async function cqrsPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyCqrs);
}

export default fp(cqrsPlugin, {
  name: 'CQRSPlugin',
});
