# 5. StyleX replaces Tailwind in the client

Date: 2026-09-22

## Status

Accepted.

## Context

`apps/client` styles its components with Tailwind 4 through the Rsbuild
Tailwind plugin. The design tokens reconciled with the Figma design system live
in an `@theme` block, a `focus-ring` utility carries the shared keyboard
affordance, twenty-eight CSS Modules compose utilities with `@apply`, and the
routes plus a few components use raw utility strings. The arrangement works,
but it keeps every style in a second language that the type checker never
sees, and nothing reports a class that no component uses any more.

This is a practice repository, and the change has two drivers: learning StyleX
on a realistic codebase, and styles that are type-checked, co-located with the
component that owns them, and flagged when unused.

## Decision

StyleX replaces Tailwind entirely. The Tailwind plugin, package, `@apply`
blocks and utility strings all go; nothing keeps both systems alive during a
transition. The remaining global stylesheet holds a port of Tailwind's preflight
(trimmed of its theme hooks and of controls the storefront never renders), the
reduced-motion and print overrides, and nothing else that a component could own.

Only the Figma-bound values become StyleX variables: the colour sets, the two
elevation shadows and the font stack, defined with `defineVars` in
`src/shared/ui/tokens.stylex.ts`. Spacing and type sizes are written as
literal values, because those scales were Tailwind's rather than the design
system's. Breakpoints and the hover guard are `defineConsts` in
`src/shared/lib/breakpoints.stylex.ts`, next to the desktop media query the
JavaScript side keeps in `breakpoints.ts`; the transition defaults sit in
`src/shared/ui/motion.stylex.ts`.

Styles are declared with `stylex.create` in the component file that uses them;
the CSS Modules disappear rather than get renamed. Shared components accept a
`style` prop of StyleX styles and merge it with `stylex.props`, so callers
never hand over class strings that would bypass last-wins merging. Values
React only knows at runtime (star fill, avatar size, swatch colour, virtualised
rows) keep the inline `style` prop. Every hover style is nested under
`@media (hover: hover)`, which is what Tailwind 4 did implicitly.

Before any component changes, the Playwright visual suite records baselines
for the home page, the catalogue grid, the product page and a seeded cart on
the desktop and mobile Chromium projects. Those eight images, at the suite's
existing one percent tolerance, are the regression net for the rewrite.

## Considered options

- Keeping Tailwind for the routes while StyleX takes the components. Rejected:
  two class systems plus the preflight reset would coexist for the whole
  transition, which is the state StyleX's own guidance warns against.
- The community Rust SWC StyleX compiler. Not adopted: it is faster, but only
  the official unplugin was verified end to end against this Rsbuild setup.
- React Server Components over React Flight, raised during planning as a
  possible companion change. Deferred; see the last consequence.

## Consequences

- The official `@stylexjs/unplugin` 0.19.1 is registered through its
  `.webpack()` export, not `.rspack()`. The Rspack adapter compiles the styles
  but never appends the generated CSS, because its injection hook is only
  registered on the webpack path that unplugin's Rspack adapter never calls.
  Rspack implements the webpack plugin API, so the webpack export works under
  Rsbuild, emits the stylesheet, and lists it in the manifest the production
  SSR reads. `treeshakeCompensation: true` is mandatory as well: without it the
  tokens import becomes value-unused after inlining, Rspack drops the file, and
  the `:root` variables are never emitted. The plugin runs in both build
  environments, so one "no CSS asset found" warning from the node bundle is
  expected on every build.
- The compiler rejects any selector that reaches another element. Parent
  variants and state-driven descendants move into conditional styles chosen by
  props and state, or into the `stylex.when` ancestor helpers. Attribute
  selectors, `:has()`, `@starting-style` and vendor pseudo-elements compile in
  0.19.1 because the validation is prefix-based, which a later release may
  tighten.
- Tailwind's preflight is gone, so a component that silently relied on it is
  caught by the visual baselines rather than by the compiler.
- The StyleX lint rules `valid-styles` and `no-unused` run through oxlint's
  JavaScript plugin support. The move from Biome to oxlint and oxfmt itself
  gets no record of its own: it is cheap to reverse.
- React Flight stays a separate, unscheduled track. The client already streams
  HTML and fetches in route loaders, so the measurable gain would be client
  JavaScript removed for static fragments, and no target for that was set. If
  it is revisited, the documented path is TanStack Start with `rsc.enabled` on
  Rsbuild, which would retire the hand-written Express SSR layer rather than
  extend it.
