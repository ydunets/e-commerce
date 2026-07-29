import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { apiErrorSerializationAdapter } from '@/shared/api';
import { GeneralErrorBoundary } from '@/shared/ui/general-error-boundary';
import { NotFound } from '@/shared/ui/not-found';
import { routeTree } from './routeTree.gen';

export interface RouterAssets {
  js: string[];
  css: string[];
}

export interface RouterContext {
  assets: RouterAssets;
}

export function createRouter(assets: RouterAssets = { js: [], css: [] }) {
  const router = createTanStackRouter({
    routeTree,
    context: { assets },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultErrorComponent: GeneralErrorBoundary,
    defaultNotFoundComponent: NotFound,
    // A missing product should read as one "does not exist" page, not as an
    // error nested inside a half-built product layout.
    notFoundMode: 'root',
  });

  // Read from `router.options` when the router dehydrates and hydrates, but
  // omitted from the constructor's type because TanStack Start supplies it
  // through its own config. Without it, ShallowErrorPlugin strips the status
  // off every ApiError a loader throws during SSR.
  router.options.serializationAdapters = [apiErrorSerializationAdapter];

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
