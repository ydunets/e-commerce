import path from 'node:path';
import { fastifyAwilixPlugin } from '@fastify/awilix';
import { asFunction, createContainer, Lifetime } from 'awilix';
import type { FastifyInstance } from 'fastify';
import { makeDependencies } from '#src/modules/index';
import { formatName } from '#src/server/di/util';

export async function di(fastify: FastifyInstance) {
  const diContainer = createContainer<Dependencies>();
  diContainer.register({
    ...makeDependencies({
      logger: fastify.log,
      queryBus: fastify.queryBus,
      commandBus: fastify.commandBus,
      eventBus: fastify.eventBus,
    }),
  });

  await diContainer.loadModules(
    [
      path.join(
        import.meta.dirname,
        '../../modules/{cart,specification}/**/*.{repository,mapper,service,domain}.{js,ts}',
      ),
    ],
    {
      formatName,
      esModules: true,
      resolverOptions: {
        register: asFunction,
        lifetime: Lifetime.SINGLETON,
      },
    },
  );

  await diContainer.loadModules(
    [
      path.join(
        import.meta.dirname,
        '../../modules/{cart,specification}/**/*.{handler,event-handler}.{js,ts}',
      ),
    ],
    {
      formatName,
      esModules: true,
      resolverOptions: {
        asyncInit: 'init',
        register: asFunction,
        lifetime: Lifetime.SINGLETON,
      },
    },
  );

  // Create a dependency injection container
  await fastify.register(fastifyAwilixPlugin, {
    container: diContainer,
    asyncInit: true,
  });
}
