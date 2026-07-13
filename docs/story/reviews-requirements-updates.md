# Reviews Feature: Requirements-Gap Updates

Closes the gaps found by the requirements-verification pass of the reviews feature
(`docs/requirements/reviews.md`) in `apps/client`. The verification found 21 of 25
discrete requirements met; this plan addresses the rest:

- **R3 (Partial)**: tablets get the desktop page size (12 instead of 10) because the
  boundary is `min-width: 768px`, which is where tablets begin.
- **R18 (Not Met)**: no responsive text sizes anywhere in the reviews UI; all fixed.
- **R16 (Ambiguous)**: design fidelity needs a visual pass; not statically verifiable.
- **R20 (Ambiguous)**: cross-browser behavior needs a Chrome/Firefox/Safari smoke check.

Sequencing: code first (Tasks 1-2), then verification (Tasks 3-4) so the visual pass
runs once against final code. The breakpoint question resolves with in-repo evidence:
`Navbar.tsx:35` already uses `(min-width: 1024px)` as the desktop cut and
`Navbar.module.css:10` documents 768px as the reference Tablet.

## Task 1 (R3): Move the page-size boundary to the project's desktop cut

- **Goal**: tablets (768-1023px) get `perPage = 10`; only true desktop (>=1024px) gets 12.
- **Files**: new `src/shared/lib/breakpoints.ts` (exported `DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'`);
  `src/widgets/product-reviews/ui/ProductReviewsDialog.tsx:40`; `src/shared/ui/navbar/Navbar.tsx:35`
  (adopt the same constant).
- **Encoding decision**: a shared constant over inline strings. Two consumers already
  disagree (768 vs 1024); one constant makes the desktop boundary a design-system fact.
  Rejected: reading Tailwind's `lg` token at runtime (needs extra machinery, new deps).
- **perPage placement**: stays in `ReviewsContent` (widget layer); it is a presentation
  input to `useReviews`, already part of the query key, so zero data-layer work.
- **Depends on**: decision D1.
- **Done-check**: `pnpm check` green; new test in `apps/client/tests` rendering the dialog
  content with `window.matchMedia` stubbed, asserting "Show 10 more reviews" when the
  desktop query does not match and "Show 12 more..." when it does.

## Task 2 (R18): Add responsive text sizes to the reviews UI

- **Goal**: fonts step up at `lg:` (same boundary as Task 1), following the
  `ProductDetails.module.css:34` precedent (`text-3xl lg:text-5xl`).
- **Files**: `ReviewSummary.tsx`, `RatingBands.tsx`, `ReviewItem.tsx`, `ReviewList.tsx`
  (EmptyState titles/body).
- **Elements + proposed pairs** (exact values need the Figma design; convention is
  one-step-down on mobile):

  | Element | Current | Proposed |
  |---|---|---|
  | "Overall Rating" heading (ReviewSummary.tsx:25) | `text-xl` | `text-lg lg:text-xl` |
  | Average value (ReviewSummary.tsx:27) | `text-base` | `text-base lg:text-lg` [design check] |
  | Band labels (RatingBands.tsx:33) | `text-base` | `text-sm lg:text-base` |
  | Band percentages (RatingBands.tsx:45) | `text-base` | `text-sm lg:text-base` |
  | Review body (ReviewItem.tsx:27) | unsized (inherits base) | `text-sm lg:text-base` |
  | Empty-state title (ReviewList.tsx:38) | `text-lg` | `text-base lg:text-lg` |
  | Reviewer name and date | `font-semibold` / `text-xs` | unchanged pending design check |

- **Depends on**: Task 1 (shares the 1024px boundary rationale); decision D2.
- **Done-check**: `pnpm check` green (existing review-list tests assert text content, not
  classes, and must pass unmodified); visual spot-check at 375px and 1440px confirming
  sizes differ.

## Task 3 (R16): Design-fidelity verification pass

- **Goal**: convert R16 from Ambiguous to Met, or produce a concrete gap list.
- **Type**: verification, no code. Output feeds new tasks only if gaps surface.
- **Checklist** (at 375px, 768px, 1440px against the Figma designs): dialog layout and
  paddings; Overall Rating block (number, stars, caption); all five rating bands (colors
  per `rating-bands.ts:10-14`, bar heights, label/percent alignment; check the
  `w-[120px]` label column does not wrap "Below Average" at the larger size); review item
  (avatar 48px, name/date row, stars, body spacing); load-more button style; both empty
  states; loading skeletons; Clear filter + disabled "Write a review" pair; hover and
  filter-active band states.
- **Depends on**: Task 2 (typography final first).
- **Done-check**: a written pass/fail per checklist row with screenshots; verdict
  "R16 Met" or an enumerated gap list (element, expected, actual).

### Task 3 report

Run 2026-07-13 against the live dev stack (SSR client + Fastify API + seeded Postgres),
product `voyager-hoodie` (62 reviews), checked at 375px, 768px, and 1440px.

| Checklist row | 375 | 768 | 1440 | Evidence |
|---|---|---|---|---|
| Dialog layout: stacks on mobile, two columns from md | Pass | Pass | Pass | computed `flex-direction: column` at 375, `row` at 768/1440 |
| Overall Rating block (number, stars, caption) | Pass | Pass | Pass | "4.1", fill-overlay stars (`aria-label` "Rated 4.1 out of 5"), "Based on 62 reviews" |
| Five rating bands, colors per design tokens | Pass | Pass | Pass | fills computed as green-600/green-500/yellow-300/yellow-500/red-600; track height 8px |
| Band label column: "Below Average" no wrap at lg size | — | — | Pass | `scrollWidth <= clientWidth` at 1440 after the Task 2 size bump |
| Percentages per band | Pass | Pass | Pass | 39/35/19/6/0% for the seeded data |
| Review item: avatar 48px, image + initials fallback | Pass | Pass | Pass | avatar box 48x48; photo avatars and "NC"/"DH" initials both observed |
| Rating-without-text renders (Darren Holmes) | Pass | Pass | Pass | stars-only review visible |
| Date format "MMMM d, yyyy" | Pass | Pass | Pass | "March 8, 2024", "May 26, 2024" |
| Load-more label reflects remaining | Pass | Pass | Pass | "Show 10 more reviews" at 375/768, "Show 12 more reviews" at 1440 |
| Filter-active band state | — | — | Pass | active label `#4338ca` (`--color-brand`), `aria-pressed=true`, single selection only |
| Filtered list correctness | — | — | Pass | Excellent filter: all visible reviews 5-star, load-more "Show 12 more" (24 total) |
| Filtered empty state + Clear filter | — | — | Pass | Poor (0%) shows "No matching reviews / No 1-star reviews yet / Clear filter" |
| Clear filter button (summary + empty state) | — | — | Pass | present in both locations when a filter is active |
| Loading skeletons (summary + list) | — | Pass | — | captured during refetch at 768 |
| Disabled "Write a review" | Pass | Pass | Pass | `disabled` attribute + disabled styling |
| Hover states | CSS verified | CSS verified | CSS verified | compiled rules present for band label (`text-ink`), buttons (`bg-surface`), clear filter (`underline`); live hover deferred to Task 4 (synthetic hover does not trigger `:hover` in the embedded pane) |

**Needs design eyes (not verifiable without the Figma file):**
1. Exact pixel spacing/padding of the dialog and columns vs the design.
2. The two D2 typography pairs applied by judgment: average value (16→18px) and
   reviewer name/date (left unchanged).

**Gaps found: none.** No concrete deviation was observed; the two rows above are
open judgment calls, not defects.

**Environment note:** the SSR dev server repeatedly exited when launched under the
editor preview harness (3x); the same command runs stable under a plain shell and all
endpoints return 200. Not an application issue.

**Verdict: R16 Met** at the structural/token/state level, provisional on a human
glance at the two "needs design eyes" rows.

## Task 4 (R20): Cross-browser smoke check

- **Goal**: convert R20 from Ambiguous to Met in Chrome, Firefox, and Safari.
- **Type**: verification, no code.
- **Checklist per browser**: dialog opens via `showModal` and closes on Esc, close
  button, and backdrop click (native `<dialog>`; Safari 15.4+ support, confirm minimum
  supported version); date renders "March 5, 2025"-style (Intl); fractional star fill
  renders identically (percentage-width overlay); virtualized list scrolls without
  blanks; load-more appends; band filter + clear filter round-trip; focus-visible rings
  on keyboard navigation.
- **Depends on**: Tasks 1-2 (code final).
- **Done-check**: checklist executed in all three browsers, deviations recorded as
  (browser, step, expected, actual); verdict "R20 Met" or gap list.

### Task 4 report

_(appended after the pass runs)_

## Decisions

- **D1**: confirm 1024px as the desktop boundary (Navbar precedent, Tailwind `lg`).
- **D2**: the two `[design check]` typography pairs in Task 2 need the Figma design, or
  proceed with proposed values and let Task 3 catch discrepancies.

## Risks

- Task 1 deliberately changes tablet UX: 10 reviews per page instead of 12 (per spec).
- SSR first paint always renders the mobile page size (`getServerSnapshot` returns
  false); pre-existing, unchanged by Task 1, noted only.
- Task 2 layout shift: `RatingBands` pins labels at `w-[120px]`; larger text could wrap
  "Below Average" (Task 3 checks this row explicitly).
- Tasks 3-4 are designed to output gap lists; budget for a small follow-up batch.
