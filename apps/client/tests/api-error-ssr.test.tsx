import { expect, test } from '@rstest/core';
import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import {
  createRequestHandler,
  RouterServer,
  renderRouterToString,
} from '@tanstack/react-router/ssr/server';
import type { ReactNode } from 'react';
import { ApiError, apiErrorSerializationAdapter } from '@/shared/api';

const CORRELATION_ID = 'e2eSSR1';

// Guards the one failure the other tests cannot see: without the serialization
// adapter, router-core's ShallowErrorPlugin rewrites the dehydrated error as
// `new Error(message)`, and every status screen degrades to the default row on
// the initial (server-rendered) load.
async function renderSsrPayload({ withAdapter }: { withAdapter: boolean }) {
  const rootRoute = createRootRoute({
    shellComponent: ({ children }: { children: ReactNode }) => (
      <html lang="en">
        <body>{children}</body>
      </html>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    loader: () => {
      throw new ApiError({
        statusCode: 503,
        message: 'Service unavailable',
        error: 'Service Unavailable',
        correlationId: CORRELATION_ID,
      });
    },
    errorComponent: () => <p>error</p>,
    component: () => <p>ok</p>,
  });

  const handler = createRequestHandler({
    request: new Request('http://localhost/'),
    createRouter: () => {
      const router = createRouter({
        routeTree: rootRoute.addChildren([indexRoute]),
      });
      if (withAdapter) {
        router.options.serializationAdapters = [apiErrorSerializationAdapter];
      }
      return router as never;
    },
  });

  const response = await handler(({ request, responseHeaders, router }) =>
    renderRouterToString({
      request,
      responseHeaders,
      router,
      children: <RouterServer router={router} />,
    }),
  );

  return { status: response.status, html: await response.text() };
}

test('the dehydrated ApiError keeps its status and correlation id', async () => {
  const { status, html } = await renderSsrPayload({ withAdapter: true });

  expect(status).toBe(500);
  expect(html).toContain('503');
  expect(html).toContain(CORRELATION_ID);
});

test('without the adapter the status is stripped from the payload', async () => {
  const { html } = await renderSsrPayload({ withAdapter: false });

  expect(html).not.toContain(CORRELATION_ID);
});
