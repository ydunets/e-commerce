import type { Decorator } from '@storybook/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';

// Components that render a router `<Link>` (e.g. ProductCard) throw outside a
// RouterProvider. This decorator mounts a throwaway root route with no
// loaders or real routeTree, so links render without hitting the network.
export const withRouter: Decorator = (Story) => {
  const rootRoute = createRootRoute({ component: Story });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  return <RouterProvider router={router} />;
};
