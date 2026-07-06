import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export interface RouterAssets {
  js: string[];
  css: string[];
}

export interface RouterContext {
  assets: RouterAssets;
}

export function createRouter(assets: RouterAssets = { js: [], css: [] }) {
  return createTanStackRouter({
    routeTree,
    context: { assets },
    defaultPreload: 'intent',
    scrollRestoration: true,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
