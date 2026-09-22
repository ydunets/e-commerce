import * as stylex from '@stylexjs/stylex';

// Tailwind 4's transition defaults, kept so converted components animate as before.
export const transitions = stylex.defineConsts({
  colors:
    'color, background-color, border-color, text-decoration-color, fill, stroke',
  duration: '150ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
});

// Tailwind's animate-pulse, shared through defineVars so one keyframes rule serves every skeleton.
export const animations = stylex.defineVars({
  pulse: stylex.keyframes({ '50%': { opacity: 0.5 } }),
});
