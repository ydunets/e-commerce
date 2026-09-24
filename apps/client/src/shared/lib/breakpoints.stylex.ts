import * as stylex from '@stylexjs/stylex';

// The design's tiers (base / md 768 / lg 1024 / xl 1280) as StyleX conditions;
// `hover` keeps hover styles off touch screens, as Tailwind 4 did implicitly.
export const media = stylex.defineConsts({
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)',
  hover: '@media (hover: hover)',
});
