import type { CartResponseDto } from '@e-commerce/contracts';
import { type FormEvent, useState } from 'react';
import { useApplyCoupon, useRemoveCoupon } from '@/entities/cart';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/text-input';
import { applyFailureMessage, validateCouponCode } from '../lib/coupon-errors';
import styles from './CouponField.module.css';
import { CloseIcon, CouponIcon } from './icons';

export type TCouponFieldProps = {
  cart: CartResponseDto;
};

const LABEL = 'Coupon code';
const PLACEHOLDER = 'Add coupon code';
const EMPTY = '';
const NO_ERROR: string | undefined = undefined;

export const CouponField = ({ cart }: TCouponFieldProps) => {
  const [opened, setOpened] = useState(false);
  const [code, setCode] = useState(EMPTY);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    NO_ERROR,
  );
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();

  // An applied coupon is only removable through its tag, so a cart that
  // already carries one opens the field whether the visitor asked for it or
  // not. Only the visitor's own click moves focus into the input.
  const open = opened || cart.coupons.length > 0;

  if (!open) {
    return (
      <button
        type="button"
        className={styles.addCoupon}
        onClick={() => setOpened(true)}
      >
        <CouponIcon className={styles.addCouponIcon} />
        Add coupon code
      </button>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();

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
    <form className={styles.root} onSubmit={submit}>
      <div className={styles.field}>
        <TextInput
          className={styles.input}
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
          className={styles.apply}
          disabled={applyCoupon.isPending}
        >
          Apply
        </Button>
      </div>

      {cart.coupons.length > 0 && (
        <ul className={styles.tags}>
          {cart.coupons.map((coupon) => (
            <li key={coupon.code}>
              <span className={styles.tag}>
                {coupon.code}
                <button
                  type="button"
                  className={styles.tagRemove}
                  aria-label={`Remove coupon ${coupon.code}`}
                  disabled={removeCoupon.isPending}
                  onClick={() => {
                    setOpened(true);
                    removeCoupon.mutate({ cartId: cart.id, code: coupon.code });
                  }}
                >
                  <CloseIcon className={styles.tagRemoveIcon} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};
