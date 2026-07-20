import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from 'typebox';
import { specificationResponseDtoSchema } from '#src/modules/specification/dtos/specification.response.dto.ts';
import { listSpecificationsQuery } from './list-specifications.handler.ts';

export default async function listSpecifications(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'GET',
    url: '/v1/specifications',
    schema: {
      description: 'List the product specification content shown on every product page',
      response: {
        200: Type.Array(specificationResponseDtoSchema),
      },
      tags: ['specifications'],
    },
    handler: async (_req, res) => {
      const specifications = await fastify.queryBus.execute(listSpecificationsQuery());
      const { specificationMapper } = fastify.diContainer.cradle;
      return res
        .status(200)
        .send(specifications.map((specification) => specificationMapper.toResponse(specification)));
    },
  });
}
