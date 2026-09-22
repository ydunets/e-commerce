import assert from 'node:assert/strict';
import { it } from 'node:test';
import { detectType, isType } from '@e-commerce/contracts';
import { HttpStatus, Module } from '@nestjs/common';
import { APP_FILTER, NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import Fastify from 'fastify';
import { CartController } from '#src/modules/cart/cart.controller';
import { SubscribeController } from '#src/modules/newsletter/commands/subscribe/subscribe.controller';
import { ProductController } from '#src/modules/product/product.controller';
import { ReviewController } from '#src/modules/review/review.controller';
import { SpecificationController } from '#src/modules/specification/specification.controller';
import { setupDocumentation } from '#src/server/plugins/swagger';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { ApiExceptionFilter } from '#src/shared/nest/exception.filter';
import { createValidationPipe } from '#src/shared/nest/validation';

const PRODUCTS = '/api/v1/products';
const PRODUCT = `${PRODUCTS}/{id}`;
const REVIEWS = `${PRODUCTS}/{productId}/reviews`;
const SUMMARY = `${REVIEWS}/summary`;
const NEWSLETTER = '/api/v1/newsletter/subscriptions';
const SPECIFICATIONS = '/api/v1/specifications';
const DOCS = '/api-docs/json';
const PRIVATE_FIELD = 'documentation-must-not-strip-this-field';

@Module({
  controllers: [
    CartController,
    ProductController,
    ReviewController,
    SubscribeController,
    SpecificationController,
  ],
  providers: [
    {
      provide: ApplicationDispatcher,
      useValue: {
        execute: async () => undefined,
        query: async () => ({ total: 0, average: 0, distribution: {}, extra: PRIVATE_FIELD }),
      },
    },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
class DocumentationTestModule {}

it('documents every migrated endpoint without changing Nest validation or response serialization', async () => {
  const fastify = Fastify();
  const app = await NestFactory.create<NestFastifyApplication>(
    DocumentationTestModule,
    new FastifyAdapter(fastify),
    { logger: false, abortOnError: false },
  );
  try {
    app.useGlobalPipes(createValidationPipe());
    setupDocumentation(app);
    await app.init();
    await fastify.ready();
    const documentResponse = await app.inject({ method: 'GET', url: DOCS });
    assert.equal(documentResponse.statusCode, HttpStatus.OK);
    const document = documentResponse.json();
    assert.equal(document.openapi, '3.0.0');
    for (const [path, method] of [
      [PRODUCTS, 'get'],
      [PRODUCT, 'get'],
      [REVIEWS, 'get'],
      [SUMMARY, 'get'],
      [NEWSLETTER, 'post'],
      [SPECIFICATIONS, 'get'],
      ['/api/v1/carts/items', 'post'],
      ['/api/v1/carts/{cartId}', 'get'],
      ['/api/v1/carts/{cartId}/items/{sku}', 'patch'],
      ['/api/v1/carts/{cartId}/items/{sku}', 'delete'],
      ['/api/v1/carts/{cartId}/coupons', 'post'],
      ['/api/v1/carts/{cartId}/coupons/{code}', 'delete'],
      ['/api/v1/carts/{cartId}/validate', 'post'],
    ]) {
      const operation = document.paths[path][method];
      assert.ok(operation.responses[HttpStatus.OK].content['application/json'].schema, path);
      assert.ok(operation.responses[HttpStatus.INTERNAL_SERVER_ERROR], path);
      assert.ok(operation.description.length > 0, path);
      assert.equal(operation.tags.length, 1, path);
      assert.equal(
        operation.responses[HttpStatus.INTERNAL_SERVER_ERROR].content['application/json'].schema
          .$ref,
        '#/components/schemas/ApiErrorResponse',
      );
    }
    assert.ok(document.paths['/health'].get.responses[HttpStatus.OK]);
    const errorSchema = document.components.schemas.ApiErrorResponse;
    assert.equal(errorSchema.properties.statusCode.example, HttpStatus.BAD_REQUEST);
    assert.equal(errorSchema.properties.subErrors.items.properties.path.example, '/email');
    assert.equal(
      errorSchema.properties.subErrors.description,
      'Field-level details for a validation failure',
    );
    function assertReferences(value: unknown): void {
      if (!(isType(value, 'object') || isType(value, 'array'))) return;
      if ('$ref' in value) {
        assert.equal(detectType(value.$ref), 'string');
        const reference = String(value.$ref);
        assert.ok(reference.startsWith('#/components/schemas/'), reference);
        const name = reference
          .slice('#/components/schemas/'.length)
          .replaceAll('~1', '/')
          .replaceAll('~0', '~');
        assert.ok(document.components.schemas[name], reference);
      }
      for (const child of Object.values(value)) assertReferences(child);
    }
    assertReferences(document);
    const addBody =
      document.paths['/api/v1/carts/items'].post.requestBody.content['application/json'].schema;
    assert.deepEqual(addBody.required, ['sku', 'quantity']);
    assert.equal(addBody.properties.quantity.minimum, 1);
    assert.ok(!addBody.required.includes('cartId'));
    const cart =
      document.paths['/api/v1/carts/{cartId}'].get.responses[HttpStatus.OK].content[
        'application/json'
      ].schema;
    assert.equal(cart.properties.lines.items.properties.sku.example, 'voyager-hoodie-brown-s');
    assert.equal(cart.properties.coupons.items.properties.code.example, 'WELCOME15');
    const ui = await app.inject({ method: 'GET', url: '/api-docs' });
    assert.equal(ui.statusCode, HttpStatus.OK);
    assert.match(ui.body, /swagger-ui/);
    const asset = await app.inject({ method: 'GET', url: '/api-docs/swagger-ui-bundle.js' });
    assert.equal(asset.statusCode, HttpStatus.OK);
    const productSchema =
      document.paths[PRODUCT].get.responses[HttpStatus.OK].content['application/json'].schema;
    assert.ok(productSchema.properties.inventory.items.properties.sku);
    const reviewsSchema =
      document.paths[REVIEWS].get.responses[HttpStatus.OK].content['application/json'].schema;
    assert.ok(reviewsSchema.properties.data.items.properties.rating);
    const queryParameters = document.paths[PRODUCTS].get.parameters;
    assert.equal(
      queryParameters.find((parameter: { name: string }) => parameter.name === 'limit').schema
        .maximum,
      100,
    );
    assert.equal(document.paths[PRODUCT].get.parameters[0].required, true);
    const body = document.paths[NEWSLETTER].post.requestBody.content['application/json'].schema;
    assert.ok(body.properties.email.pattern);
    assert.deepEqual(body.required, ['email']);

    const invalid = await app.inject({
      method: 'POST',
      url: NEWSLETTER,
      payload: { email: 'invalid' },
    });
    assert.equal(invalid.statusCode, HttpStatus.BAD_REQUEST);
    assert.equal(invalid.json().subErrors[0].path, '/email');
    const coerced = await app.inject({
      method: 'POST',
      url: NEWSLETTER,
      payload: { email: ['visitor@example.com'] },
    });
    assert.equal(coerced.statusCode, HttpStatus.OK);
    const summary = await app.inject({
      method: 'GET',
      url: SUMMARY.replace('{productId}', 'example'),
    });
    assert.equal(summary.statusCode, HttpStatus.OK);
    assert.equal(summary.json().extra, PRIVATE_FIELD);
  } finally {
    await app.close();
  }
});
