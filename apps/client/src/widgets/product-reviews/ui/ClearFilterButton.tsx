import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { media } from '@/shared/lib/breakpoints.stylex';
import { focusRing } from '@/shared/ui/focus-ring';
import { colors } from '@/shared/ui/tokens.stylex';

export type TClearFilterButtonProps = {
  onClick: () => void;
  style?: StyleXStyles;
};

const styles = stylex.create({
  root: {
    borderRadius: '0.25rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 500,
    color: colors.brand,
    textDecorationLine: {
      default: 'none',
      ':hover': { default: null, [media.hover]: 'underline' },
    },
  },
});

export const ClearFilterButton = ({
  onClick,
  style,
}: TClearFilterButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    {...stylex.props(styles.root, focusRing.ring, style)}
  >
    Clear filter
  </button>
);
