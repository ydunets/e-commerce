import * as stylex from '@stylexjs/stylex';
import { colors } from './tokens.stylex';

// Shared keyboard-focus affordance, matching Figma's focus-band: a 1px solid
// ring plus a 4px translucent halo. box-shadow follows the element's own
// border-radius, so it works on pills, circles and inputs alike.
export const focusRing = stylex.create({
  ring: {
    outline: { default: null, ':focus-visible': 'none' },
    boxShadow: {
      default: null,
      ':focus-visible': `0 0 0 1px ${colors.focus}, 0 0 0 4px color-mix(in srgb, ${colors.focus} 12%, transparent)`,
    },
  },
});
