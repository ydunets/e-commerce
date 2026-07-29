import { afterEach, beforeEach, expect, rstest, test } from '@rstest/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { ApiError } from '@/shared/api';
import { GeneralErrorBoundary } from '@/shared/ui/general-error-boundary';

type THealth = { app: boolean; api: boolean };

const HEALTHY: THealth = { app: true, api: true };

const originalFetch = global.fetch;
const originalConsoleError = console.error;

function stubHealth(health: THealth) {
  global.fetch = rstest.fn(async (input: RequestInfo | URL) => {
    const ok = String(input).includes('/healthz') ? health.app : health.api;
    return new Response(JSON.stringify({ status: ok ? 'ok' : 'down' }), {
      status: ok ? 200 : 503,
    });
  }) as typeof global.fetch;
}

// The health probe resolves in an effect, so the render and the probe both have
// to settle inside act before the screen is queried.
async function renderBoundary(error: unknown, health: THealth = HEALTHY) {
  stubHealth(health);

  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    loader: () => {
      throw error;
    },
    errorComponent: GeneralErrorBoundary,
    component: () => <div>loaded</div>,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  await router.load();

  await act(async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router as never} />
      </QueryClientProvider>,
    );
  });
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  console.error = () => {};
});

afterEach(() => {
  global.fetch = originalFetch;
  console.error = originalConsoleError;
});

test('a 400 ApiError renders the bad-request screen with its field errors', async () => {
  await renderBoundary(
    new ApiError({
      statusCode: 400,
      message: 'Validation error',
      error: 'Bad Request',
      correlationId: 'YevPQs',
      subErrors: [{ path: '/email', message: 'must be an email' }],
    }),
  );

  expect(screen.getByText('Bad request')).toBeInTheDocument();
  expect(screen.getByText('must be an email')).toBeInTheDocument();
  expect(screen.getByText('Reference: YevPQs')).toBeInTheDocument();
});

test('a 500 ApiError renders the server-error screen with a retry action', async () => {
  await renderBoundary(
    new ApiError({
      statusCode: 500,
      message: 'Internal Server Error',
      error: 'Internal Server Error',
    }),
  );

  expect(
    screen.getByText('Something went wrong on our end'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
});

test('an error without a status falls back to the unexpected-error screen', async () => {
  await renderBoundary(new TypeError('Failed to fetch'));

  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
});

test('an unreachable app server replaces the status screen', async () => {
  await renderBoundary(
    new ApiError({
      statusCode: 500,
      message: 'Internal Server Error',
      error: 'Internal Server Error',
    }),
    { app: false, api: false },
  );

  expect(screen.getByText('Cannot reach the app server')).toBeInTheDocument();
});

test('a live app server with a dead API reports the API outage', async () => {
  await renderBoundary(
    new ApiError({
      statusCode: 502,
      message: 'The store service is unreachable.',
      error: 'Bad Gateway',
    }),
    { app: true, api: false },
  );

  expect(
    screen.getByText('The store service is unavailable'),
  ).toBeInTheDocument();
});
