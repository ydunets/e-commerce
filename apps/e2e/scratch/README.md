# Scratch exercises

Playwright capabilities this application cannot host yet, written out so the
technique is on record and can be lifted when the feature arrives. They live
outside `testDir`, so `pnpm e2e` never sees them, and every exercise skips
itself with the reason it cannot run.

Run them deliberately:

```bash
pnpm --filter @e-commerce/e2e exec playwright test --config=scratch/playwright.scratch.config.ts
```

| Exercise | Waiting on |
| --- | --- |
| `multi-role-storage-state.scratch.ts` | accounts and sign-in; the shop's cart is anonymous (ADR 0002) |
| `websocket-routing.scratch.ts` | a live feed; nothing in the shop opens a socket |
