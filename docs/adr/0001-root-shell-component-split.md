# Root route splits into a shell and a component

The router-level `defaultErrorComponent` replaces the *component* of whichever route failed, and for a root-level failure that used to mean the `<html>`, `<head>` and `<body>` elements disappeared with it, because `RootComponent` rendered them. In `Match.tsx` the root route's `shellComponent` renders **outside** the catch boundary while `component` renders inside it, so the document, the query provider and the page chrome now live in `shellComponent` and `component` is just `<Outlet />`. Without that split, an error in any root-level loader or in the root component would stream a fragment with no document shell.

## Consequences

- Anything an error screen depends on has to sit in the shell. `QueryClientProvider` moved there for exactly this reason: the boundary resets query errors on retry.
- The `data-hydrated` attribute that e2e tests wait on is set from the shell, so it still appears when a route renders an error instead of a page.
