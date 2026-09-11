import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { subscribeResponseDtoSchema } from '#src/modules/newsletter/dtos/subscribe.response.dto';
import { subscribeCommand } from './subscribe.handler.js';
import { subscribeBodySchema } from './subscribe.schema.js';

export default async function subscribe(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'POST',
    url: '/v1/newsletter/subscriptions',
    schema: {
      description: 'Subscribe an email address to the newsletter',
      body: subscribeBodySchema,
      response: {
        200: subscribeResponseDtoSchema,
      },
      tags: ['newsletter'],
    },
    handler: async (req, res) => {
      await fastify.commandBus.execute(subscribeCommand({ email: req.body.email }));
      return res
        .status(200)
        .send(fastify.diContainer.cradle.newsletterMapper.toSubscribeResponse());
    },
  });
}
