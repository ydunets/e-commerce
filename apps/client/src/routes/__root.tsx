import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Navbar } from '@/shared/ui/navbar';
import type { RouterContext } from '../router';
import '../app.css';

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap';

export const Route = createRootRouteWithContext<RouterContext>()({
  // Loader data is dehydrated to the client, so the asset lists rendered on
  // the server match what the client sees during hydration.
  loader: ({ context }) => context.assets,
  head: ({ loaderData }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'StyleNest' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      { rel: 'stylesheet', href: GOOGLE_FONTS_URL },
      ...(loaderData?.css ?? []).map((href) => ({
        rel: 'stylesheet',
        href,
      })),
    ],
    scripts: (loaderData?.js ?? []).map((src) => ({ src, defer: true })),
  }),
  component: RootComponent,
});

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
      }),
  );

  // Synchronizes hydration state to the DOM for e2e tests: effects only run
  // after hydration commits, so the attribute marks the page as interactive.
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true';
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <Navbar
            links={[
              { label: 'Home', href: '/' },
              { label: 'Products', href: '/products' },
              { label: 'About', href: '/about' },
            ]}
            brandHref="/"
            cartHref="/"
          />
          <Outlet />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
