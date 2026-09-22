import * as stylex from '@stylexjs/stylex';
import { media } from '@/shared/lib/breakpoints.stylex';
import { useRadioGroup } from '@/shared/lib/useRadioGroup';
import { focusRing } from '@/shared/ui/focus-ring';
import { transitions } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';

export type TSizeOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type TSizeSelectorProps = {
  options: TSizeOption[];
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
};

const styles = stylex.create({
  root: { display: 'flex', flexWrap: 'wrap', gap: '1rem' },
  // Figma: fixed 64px pills, left-packed (wrap when the row is full), not stretched.
  size: {
    display: 'flex',
    height: '3rem',
    minWidth: '64px',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.25rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      default: colors.line,
      ':hover': { default: null, [media.hover]: colors.gray300 },
    },
    backgroundColor: '#fff',
    paddingInline: '1.25rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 500,
    color: colors.ink,
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  // Figma selected state: indigo-600 border, text stays ink.
  selected: { borderColor: colors.brandSolid },
  disabled: {
    cursor: 'not-allowed',
    borderColor: colors.line,
    backgroundColor: colors.gray100,
    color: colors.gray200,
  },
});

export const SizeSelector = ({
  options,
  value,
  onChange,
  label = 'Available sizes',
}: TSizeSelectorProps) => {
  const { handleKeyDown, optionRef, select, tabIndexFor } = useRadioGroup(
    options,
    value,
    onChange,
  );

  return (
    // oxlint-disable-next-line jsx-a11y/interactive-supports-focus -- WAI-ARIA radiogroup composite with roving tabindex: focus lives on the radios, not on the group.
    <div
      {...stylex.props(styles.root)}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={optionRef(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={option.disabled}
            tabIndex={tabIndexFor(option.value)}
            {...stylex.props(
              styles.size,
              focusRing.ring,
              selected && styles.selected,
              option.disabled && styles.disabled,
            )}
            onClick={() => select(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
