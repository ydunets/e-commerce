# Effects refactor plan for the ui-kit migration

> **STATUS (2026-07-06): APPLIED.** Items 1-3 landed with the migration; item 4's keeps are in place.

Audit of every hook-using file in `~/eduspace/ui-kit/src` against [you-might-not-need-an-effect.md](you-might-not-need-an-effect.md). Refactors are applied **in this repo as each file is migrated** (per the phase it lands in — see [../ui-kit-migration-plan.md](../ui-kit-migration-plan.md)); the ui-kit source stays untouched.

## Verdict summary

| File | Effects? | Verdict | Action |
|---|---|---|---|
| `shared/lib/useMediaQuery.ts` | no (`useSyncExternalStore`) | ✅ already the doc's recommended pattern | migrate as-is; mind the SSR snapshot (below) |
| `shared/ui/image-gallery/ImageGallery.tsx` | no | ✅ exemplary derived-state design | migrate as-is |
| `widgets/.../useProductSelection.ts` | no | ✅ clean, but state inits from props | add `key={productId}` at the mount site |
| `shared/ui/navbar/Navbar.tsx` | 1 | ⚠️ state-sync effect | replace with derived value |
| `shared/lib/use-query.ts` | 1 | ⚠️ effect fetching (race-safe) | supersede with route loaders where it matters |
| `entities/product/api/useProduct.ts` | via use-query | ⚠️ | replace with route loader (Phase 5) |
| `shared/ui/server-status/ServerStatus.tsx` | via use-query | ✅ acceptable | keep client-side (it monitors liveness) |
| `app/App.tsx` (demo shell) | no | n/a | not migrated; becomes Storybook controls |

## Item 1 — Navbar: delete the only real anti-pattern effect (Phase 3)

Current code adjusts state when a prop-like value changes (doc §4):

```tsx
const [open, setOpen] = useState(false);
const isDesktop = useMediaQuery('(min-width: 1024px)');
useEffect(() => {
  if (isDesktop) setOpen(false);   // extra render pass; aria-expanded stale for one frame
}, [isDesktop]);
```

There's also a latent bug the effect papers over: when the viewport crosses to desktop, the `<dialog>` unmounts without firing `onClose`, so without the effect `open` would stay `true` forever.

**Refactor: derive instead of syncing.** `open` only feeds `aria-expanded`; the dialog's real visibility is DOM-managed (`showModal`/`close`):

```tsx
const [open, setOpen] = useState(false);          // written only by events
const isDesktop = useMediaQuery('(min-width: 1024px)');
const drawerOpen = open && !isDesktop;            // derived — no effect, no extra pass
// use drawerOpen for aria-expanded; setOpen stays in openDrawer / onClose
```

No effect, no transient stale frame, and the desktop-crossing case is correct by construction.

## Item 2 — Product selection: reset by `key`, not by effect (Phase 4)

`useProductSelection` is effect-free and does everything in handlers + derived values — keep it exactly as designed. But it initializes state from `product` (doc §3 nuance: `useState(init)` reads props only on first render), and TanStack Router **reuses** route components across `/products/a → /products/b` navigations. Without a reset, product B would show product A's color/size/quantity selection.

**Refactor at the mount site**, per doc §3:

```tsx
// routes/products/$productId.tsx
<ProductDetailsSection key={product.id} product={product} … />
```

Also do this in the Storybook story when switching the demo-state control, so `quantity` re-initializes for the `max` state.

Explicitly rejected alternative: `useEffect(() => resetSelection(), [product.id])` inside the hook — that's the doc's §3 anti-pattern (stale render first, reset logic duplicated per state variable).

## Item 3 — Product fetching: loaders replace `useProduct` (Phase 5)

`use-query.ts` already implements the doc's §12 minimum bar (an `active` staleness flag with cleanup — no race condition). What it can't fix, per §12: the server renders a spinner instead of data, remounts refetch, and requests start only after render.

**Refactor: the product route fetches in its loader** instead of rendering `ProductDetailsSection → useProduct → useQuery`:

```tsx
export const Route = createFileRoute('/products/$productId')({
  loader: ({ params }) => getProduct(params.productId),   // SSR + dehydrated, no race
  component: ProductPage,                                  // reads Route.useLoaderData()
});
```

`getProduct` stays a plain async function (server-side it targets `API_URL`, client-side `/api` — the proxy is already in place). `ProductDetails` becomes purely presentational (data down, per doc §10). `useProduct` is then dead code — don't migrate it.

## Item 4 — What deliberately keeps its effects

- **`ServerStatus`**: monitoring the API's liveness *is* synchronizing with an external system (doc's legitimate-Effect category), and SSR-fetching a health check would be misleading (it would report the server's own view at render time). Migrate with `use-query` as-is in Phase 5. If we later adopt TanStack Query, this is the first candidate (gains polling/refetch-on-focus for free).
- **`useMediaQuery`**: keep. One SSR nuance to verify in Phase 3: the server snapshot returns `false` (mobile-first), so the desktop nav must be CSS-responsive (`Navbar.module.css` breakpoints), with JS only controlling the drawer. If the desktop layout depended on `isDesktop` for first paint, desktop users would see a mobile flash after hydration. Check the rendered HTML during Phase 3 verification.

## Guardrails for all newly written migration code

1. No `useState` + `useEffect` pairs that mirror props — derive, or lift to a loader.
2. No `useMemo` without a measured reason — the client build has React Compiler enabled.
3. Any new browser-API subscription goes through `useSyncExternalStore` with an explicit, deliberate server snapshot.
4. Mutations (add to cart, etc., when they arrive) live in event handlers; never in state-watching effects (doc §5/§6).
5. Once-per-app init belongs in `entry-client.tsx` behind `typeof window !== 'undefined'` — never in a component mount effect.
