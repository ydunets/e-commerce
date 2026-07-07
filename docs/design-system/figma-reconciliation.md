# Design-system reconciliation with Figma

Source of truth: `product-details-section-figma`, style-guide frame node `1:1588`
(read via the Figma MCP with the `kasper.197.dev@gmail.com` account, which has Dev access).

Our tokens live in [apps/client/src/app.css](../../apps/client/src/app.css) `@theme`. This
records how they map to Figma and what changed.

## Token mapping (semantic → Figma variable)

| Our token | Value | Figma variable |
|---|---|---|
| `--color-ink-strong` | `#0a0a0a` | neutral-950 · Background/primary-inverted, Text/primary-hover |
| `--color-ink` | `#171717` | neutral-900 · Text/primary |
| `--color-muted` | `#525252` | neutral-600 · Text/secondary |
| `--color-disabled` | `#a3a3a3` | neutral-400 · Text/disabled, Icon/primary |
| `--color-line` | `#e5e5e5` | neutral-200 · Border/primary |
| `--color-surface` | `#f5f5f5` | neutral-100 · Background/disabled |
| `--color-brand` | `#4338ca` | indigo-700 · Background/brand-primary |
| `--color-brand-dark` | `#3730a3` | indigo-800 · Background/brand-primary-emphasize |
| `--color-brand-solid` | `#4f46e5` | indigo-600 · Border/brand-solid (selected) |
| `--color-focus` | `#444ce7` | focus-band ring |
| `--color-star` | `#facc15` | yellow-400 · Icon/warning |
| `--color-warning` / `-soft` / `-line` | `#b45309` / `#fffbeb` / `#fde68a` | amber-700 / amber-50 / amber-200 · Text/warning, Background/warning-subtle, Border/warning-subtle |
| `--color-success` / `-soft` / `-line` | `#15803d` / `#f0fdf4` / `#bbf7d0` | green-700 / green-50 / green-200 |
| `--color-danger` / `-soft` / `-line` | `#dc2626` / `#fef2f2` / `#fecaca` | red-600 / red-50 / red-200 |

## What changed in this pass

- **Values aligned to Figma:** `line` `#e5e7eb → #e5e5e5`, `surface` `#f3f4f6 → #f5f5f5`,
  `star` `#f9cb15 → #facc15`.
- **Gold `sale` tokens removed.** The Figma discount badge is the **amber `warning`** scheme,
  not a custom gold. `--color-sale`/`--color-sale-soft` are gone; the badge uses
  `warning` tokens.
- **New semantic tokens added** with Figma provenance: `disabled`, `brand-solid`, `focus`,
  and the `warning` / `success` / `danger` subtle-scheme triples.
- **Badge** ([Badge.tsx](../../apps/client/src/shared/ui/badge/Badge.tsx)) rebuilt to the Figma
  spec: a pill (`rounded-full`) with a 1px subtle border, 14px normal text, `px-2.5 py-1`.
  Variants are status schemes (`neutral` / `warning` / `success` / `danger`); the discount
  badge is `warning`. Verified in-browser: bg `#fffbeb`, border `#fde68a`, text `#b45309`.
- **Button** ([Button.tsx](../../apps/client/src/shared/ui/button/Button.tsx)): radius
  `rounded-lg (8px) → rounded-sm (4px)` per Figma `--rounded`; added the Figma `shadow`
  drop-shadow to `primary`/`secondary`; disabled state now uses `Background/disabled` +
  `Text/disabled`.
- **Tooltip** ([Tooltip.tsx](../../apps/client/src/shared/ui/tooltip/Tooltip.tsx)): built to the
  Figma Tooltip spec (bg `#0a0a0a`, `rounded-lg`, `shadow-lg`, down arrow). Used by the
  Cart control (QuantityStepper) for the "Insufficient stock" hint.
- **Focus ring** ([app.css](../../apps/client/src/app.css) `@utility focus-ring`): reimplemented
  as Figma's focus-band — a 1px solid `--color-focus` ring plus a 4px 12%-alpha halo
  (`box-shadow`, so it follows border-radius).

## Follow-ups (not yet done)

1. **Neutral scale migration.** The raw `--color-gray-*` scale is still Tailwind's cool gray;
   Figma uses a true-gray `neutral-*` scale. Migrating shifts several components (line-through
   price, some disabled/border usages) subtly cool→neutral. Deferred as a separate, reviewable
   change.
2. **Button size scale.** Only the Figma primary 2XL was pulled (`px-6 py-4`, 18px). Our
   `md`/`lg`/`xl` sizes are close but not yet mapped 1:1 to Figma's 2XL/XL/… scale, nor are the
   per-state (hover/focus) button specs verified against Figma.
3. **Cart control / Color swatches / Selector** internals (borders, disabled colors) still use
   the legacy gray scale in spots; align when the neutral migration lands.
