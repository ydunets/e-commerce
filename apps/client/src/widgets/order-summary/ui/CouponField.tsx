import type { CartResponseDto } from '@e-commerce/contracts';
import * as stylex from '@stylexjs/stylex';
import { type FormEvent, useState } from 'react';
import { useApplyCoupon, useCartState, useRemoveCoupon } from '@/entities/cart';
import { media } from '@/shared/lib/breakpoints.stylex';
import { Button } from '@/shared/ui/button';
import { focusRing } from '@/shared/ui/focus-ring';
import { transitions } from '@/shared/ui/motion.stylex';
import { TextInput } from '@/shared/ui/text-input';
import { colors } from '@/shared/ui/tokens.stylex';
import { applyFailureMessage, validateCouponCode } from '../lib/coupon-errors';
import { CloseIcon, CouponIcon } from './icons';

export type TCouponFieldProps = {
  cart: CartResponseDto;
};

const LABEL = 'Coupon code';
const PLACEHOLDER = 'Add coupon code';
const EMPTY = '';
const NO_ERROR: string | undefined = undefined;

const styles = stylex.create({
  root: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  addCoupon: {
    display: 'inline-flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '0.375rem',
    alignSelf: 'flex-end',
    borderRadius: '0.25rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 500,
    color: {
      default: colors.brand,
      ':hover': { default: null, [media.hover]: colors.brandDark },
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  addCouponIcon: { width: '1.25rem', height: '1.25rem' },
  field: { display: 'flex', alignItems: 'flex-start', gap: '0.5rem' },
  input: { minWidth: 0, flexGrow: 1, flexShrink: 1, flexBasis: '0%' },
  /* TextInput stacks a 20px label above a 4px gap, so the button drops by that
     much to sit on the input row, and the error message that appears underneath
     cannot shift it. */
  apply: { marginTop: '1.5rem', width: '5rem', flexShrink: 0 },
  tags: {
    margin: 0,
    display: 'flex',
    listStyle: 'none',
    flexWrap: 'wrap',
    gap: '0.5rem',
    padding: 0,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    borderRadius: '0.25rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.line,
    backgroundColor: colors.surfaceStrong,
    paddingBlock: '0.25rem',
    paddingRight: '0.25rem',
    paddingLeft: '0.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 500,
    color: colors.ink,
  },
  tagRemove: {
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    borderRadius: '0.25rem',
    color: {
      default: colors.ink,
      ':hover': { default: null, [media.hover]: colors.brand },
      ':disabled': colors.disabled,
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  tagRemoveIcon: { width: '1.25rem', height: '1.25rem' },
});

export const CouponField = ({ cart }: TCouponFieldProps) => {
  const [opened, setOpened] = useState(false);
  const [code, setCode] = useState(EMPTY);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    NO_ERROR,
  );
  const applyCoupon = useApplyCoupon();
  const state = useCartState();
  const disabled = state.checking || state.stock !== null;
  const removeCoupon = useRemoveCoupon();

  // An applied coupon is only removable through its tag, so a cart that
  // already carries one opens the field whether the visitor asked for it or
  // not. Only the visitor's own click moves focus into the input.
  const open = opened || cart.coupons.length > 0;

  if (!open) {
    return (
      <button
        type="button"
        {...stylex.props(styles.addCoupon, focusRing.ring)}
        disabled={disabled}
        onClick={() => setOpened(true)}
      >
        <CouponIcon {...stylex.props(styles.addCouponIcon)} />
        Add coupon code
      </button>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;

    const invalid = validateCouponCode(code);
    if (invalid !== null) {
      setErrorMessage(invalid);
      return;
    }

    applyCoupon.mutate(
      { cartId: cart.id, code: code.trim() },
      {
        onSuccess: () => {
          setCode(EMPTY);
          setErrorMessage(NO_ERROR);
        },
        onError: (failure) => setErrorMessage(applyFailureMessage(failure)),
      },
    );
  };

  return (
    <form {...stylex.props(styles.root)} onSubmit={submit}>
      <div {...stylex.props(styles.field)}>
        <TextInput
          style={styles.input}
          disabled={disabled}
          autoFocus={opened}
          label={LABEL}
          name="coupon"
          placeholder={PLACEHOLDER}
          value={code}
          onChange={(next) => {
            setCode(next);
            setErrorMessage(NO_ERROR);
          }}
          errorMessage={errorMessage}
        />
        <Button
          type="submit"
          variant="secondary"
          style={styles.apply}
          disabled={disabled || applyCoupon.isPending}
        >
          Apply
        </Button>
      </div>

      {cart.coupons.length > 0 && (
        <ul {...stylex.props(styles.tags)}>
          {cart.coupons.map((coupon) => (
            <li key={coupon.code}>
              <span {...stylex.props(styles.tag)}>
                {coupon.code}
                <button
                  type="button"
                  {...stylex.props(styles.tagRemove, focusRing.ring)}
                  aria-label={`Remove coupon ${coupon.code}`}
                  disabled={disabled || removeCoupon.isPending}
                  onClick={() => {
                    setOpened(true);
                    removeCoupon.mutate({ cartId: cart.id, code: coupon.code });
                  }}
                >
                  <CloseIcon {...stylex.props(styles.tagRemoveIcon)} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};
