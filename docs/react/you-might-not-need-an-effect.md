# You Might Not Need an Effect — distilled nuances

Source: https://react.dev/learn/you-might-not-need-an-effect
Context notes marked **[our stack]** apply to this repo (React 19, React Compiler enabled in the client, TanStack Router SSR with loaders).

## The one governing question

> Is this code running because the component was **displayed**, or because the user **did something**?

- Displayed → Effect (synchronizing with an external system).
- User action → event handler. Handlers know exactly *what happened*; Effects only know *state changed*, which is why notification/POST logic in Effects re-fires on reload or unrelated re-renders.

Effects are an escape hatch to step *outside* React. If no external system is involved (network, DOM APIs, subscriptions, third-party widgets), you likely don't need one. Removing unneeded Effects makes code faster (fewer render passes), simpler, and less error-prone.

## 1. Deriving data from props/state → calculate during render

Anti-pattern: `useState` + `useEffect(() => setFullName(a + ' ' + b))`.
Fix: `const fullName = a + ' ' + b;` — no state, no effect.

Nuance: the effect version renders with a *stale* value first, then re-renders. Redundant state can silently desync from its source.

## 2. Expensive calculations → `useMemo`, not state + Effect

Fix: `useMemo(() => filter(todos, tab), [todos, tab])`.

Nuances:
- Only memoize genuinely expensive work (rule of thumb: >1ms; measure with `console.time`, and throttle CPU when profiling — dev machines are faster than users').
- `useMemo` doesn't make the *first* calculation faster, only skips repeats.
- **[our stack]** the client has `reactCompiler: true` — the compiler auto-memoizes most of this, so manual `useMemo` should be rare and justified.

## 3. Resetting *all* state when a prop changes → `key`

Anti-pattern: `useEffect(() => setComment(''), [userId])` (renders stale, then resets; must repeat in every stateful child).
Fix: `<Profile userId={userId} key={userId} />` — a different `key` makes React treat it as a *different component*: whole subtree state resets atomically.

Nuance: state initialized from props (`useState(props.x)`) only reads the prop on the **first** render. If the identity of the entity changes, `key` is the correct reset mechanism.
**[our stack]** route components are reused across param navigations (`/products/a` → `/products/b`), so widgets holding per-product state must be keyed by product id.

## 4. Adjusting *some* state when a prop changes

Preference order:
1. **Best:** don't store it — derive it (`items.find(i => i.id === selectedId) ?? null` instead of resetting `selection` when `items` changes).
2. **Acceptable:** set state *during render* behind a comparison guard:
   ```js
   const [prevItems, setPrevItems] = useState(items);
   if (items !== prevItems) { setPrevItems(items); setSelection(null); }
   ```
   Rules: only the *same* component's state; must be conditional (else infinite loop); React discards the render output and re-runs immediately — before touching the DOM and before children render, so it's cheaper than an Effect but still harder to follow than deriving.
3. **Worst:** Effect.

## 5. Sharing logic between event handlers → plain function

If two handlers need the same behavior, extract a function and call it from both. Putting it in an Effect keyed on state ("if in cart, show notification") re-fires on refresh/remount because the Effect answers "is it displayed", not "did the user just do it".

## 6. POST requests: split by cause

- Analytics "page/component shown" → Effect is correct (double-fire in dev StrictMode is acceptable noise; don't contort code to avoid it).
- Form submission / any user-triggered mutation → event handler. The state-then-effect relay (`setJsonToSubmit(...)` → effect posts) is a bug factory: double-posts in dev, fires on unrelated changes.

## 7. Chains of Effects that trigger each other → one event handler

Cascading `useEffect`s (card → goldCount → round → gameOver) cause N sequential render passes and break when requirements change (e.g. replaying history sets state that re-triggers the chain). Compute everything derivable during render (`const isGameOver = round > 5`) and do the multi-step updates in the handler.

Nuance: inside a handler, state is a snapshot of the render it was created in — after `setRound(round + 1)`, `round` is still old; use `const nextRound = round + 1` for follow-on logic.

## 8. App-wide one-time init → module level, not mount Effect

`useEffect(fn, [])` in `App` runs twice in dev (StrictMode) and again on remounts. For once-per-app-load logic:
- top-level `let didInit = false` guard inside the effect, or
- run at module scope, guarded: `if (typeof window !== 'undefined') { checkAuthToken(); }`

Nuances: components should be resilient to remounting — treat StrictMode's double-invoke as a bug detector, not an annoyance. Module-level init runs on import even if the component never renders; keep it in root entry modules only. **[our stack]** the `typeof window` guard is mandatory — entry modules also execute in the SSR bundle.

## 9. Notifying the parent of state changes → same event, both updates

Anti-pattern: child `useEffect(() => onChange(isOn), [isOn])` — parent updates one render pass *after* the child.
Fix A: call `setIsOn(next)` **and** `onChange(next)` in the same handler — React batches updates from one event into a single pass, across components.
Fix B (often better): delete the child state entirely — fully controlled component (`isOn` comes from the parent, child only calls `onChange`).

## 10. Passing data *up* to the parent → don't; parent fetches, child receives

A child pushing fetched data up via `useEffect(() => onFetched(data))` makes data flow untraceable. Move the fetch to the parent, pass data down. One-way data flow keeps bugs findable by walking up the tree.

## 11. Subscribing to an external store → `useSyncExternalStore`

Manual `useEffect` + `addEventListener` + `setState` works but is boilerplate and re-implements what React provides:

```js
useSyncExternalStore(
  subscribe,               // stable function: (callback) => unsubscribe
  () => navigator.onLine,  // client snapshot
  () => true,              // SERVER snapshot — what SSR renders
)
```

Nuances: `subscribe` must be stable (module scope or memoized) or React resubscribes every render. The third argument decides SSR/hydration output — pick the value that's least wrong for the first paint and make sure hydration mismatch is acceptable or CSS-mitigated.

## 12. Fetching data in Effects — allowed, but know the traps

- **Race condition** is the non-negotiable part: fast typing fires overlapping requests that can resolve out of order. Every fetch effect needs a staleness guard:
  ```js
  useEffect(() => {
    let ignore = false;
    fetchResults(q).then(json => { if (!ignore) setResults(json); });
    return () => { ignore = true; };
  }, [q]);
  ```
- Remaining downsides even when race-safe: no SSR data (server renders the spinner), network waterfalls (parent loads, then child starts), no cache (remount = refetch), and boilerplate.
- Recommended ladder: framework loader mechanism > purpose-built library (TanStack Query, SWR) > hand-rolled `useData(url)` custom hook > raw effects in components.
- **[our stack]** TanStack Router loaders are our first choice: they run on the server for the initial request (data is in the SSR HTML and dehydrated), and on the client for navigations — no race conditions, no waterfall, no spinner-on-first-paint.

## Recap table

| Scenario | Tool |
|---|---|
| Transform/derive data for rendering | Calculate during render |
| Cache expensive calculation | `useMemo` (rarely needed with React Compiler) |
| Reset all state on identity change | `key` prop |
| Adjust some state on prop change | Derive it; last resort: guarded setState during render |
| Shared logic between user actions | Plain function called from handlers |
| User-triggered POST / mutation | Event handler |
| Chained state computations | Single event handler + derived values |
| Once-per-app initialization | Module scope (SSR-guarded) or `didInit` flag |
| Notify parent | Same-handler updates (batched) or controlled component |
| Child fetches for parent | Parent fetches, passes down |
| External store / browser API subscription | `useSyncExternalStore` |
| Data fetching tied to props/state | Route loader first; effect with `ignore` cleanup as fallback |
| Synchronizing with a genuinely external system | Effect — this is what they're for |
