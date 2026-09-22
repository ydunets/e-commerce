import { apiErrorResponseSchema } from '@e-commerce/contracts';
import type { INestApplication } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Health is mounted directly on Fastify and is therefore outside Nest's route explorer. */
export function setupDocumentation(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('StyleNest e-commerce API')
    .setDescription('OpenAPI documentation for the StyleNest e-commerce backend.')
    .setVersion(process.env.npm_package_version ?? '0.0.0')
    .setOpenAPIVersion('3.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config, { autoTagControllers: false });
  // Use the contract's native Standard JSON Schema exporter, not a conversion adapter.
  const errorSchema = apiErrorResponseSchema['~standard'].jsonSchema.output({
    target: 'openapi-3.0',
  });
  delete errorSchema.$id;
  document.components ??= {};
  document.components.schemas ??= {};
  document.components.schemas.ApiErrorResponse = errorSchema;
  document.paths['/health'] = {
    get: {
      responses: {
        [HttpStatus.OK]: {
          description: 'Health Check Succeeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Health Check Succeeded',
                properties: { status: { type: 'string' } },
                example: { status: 'ok' },
              },
            },
          },
        },
        [HttpStatus.INTERNAL_SERVER_ERROR]: {
          description: 'Error Performing Health Check',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'Error message for failure during health check',
                    example: 'Internal Server Error',
                  },
                  statusCode: {
                    type: 'number',
                    description:
                      'Code representing the error. Always matches the HTTP response code.',
                    example: HttpStatus.INTERNAL_SERVER_ERROR,
                  },
                },
              },
            },
          },
        },
        [HttpStatus.SERVICE_UNAVAILABLE]: {
          description: 'Health Check Failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'string',
                    description: 'Error code associated with the failing check',
                    example: 'FST_UNDER_PRESSURE',
                  },
                  error: {
                    type: 'string',
                    description: 'Error thrown during health check',
                    example: 'Service Unavailable',
                  },
                  message: {
                    type: 'string',
                    description: 'Error message to explain health check failure',
                    example: 'Service Unavailable',
                  },
                  statusCode: {
                    type: 'number',
                    description:
                      'Code representing the error. Always matches the HTTP response code.',
                    example: HttpStatus.SERVICE_UNAVAILABLE,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: '/api-docs/json',
    raw: ['json'],
  });
  return document;
}
