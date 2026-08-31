import { isApiError } from '@/shared/api';

const NOT_FOUND = 404;

export const EMPTY_CODE_MESSAGE = 'Please enter a valid code';
export const UNKNOWN_CODE_MESSAGE = "Sorry, but this coupon doesn't exist";
export const APPLY_FAILED_MESSAGE =
  "Couldn't apply the coupon. Please try again.";

export function validateCouponCode(code: string): string | null {
  return code.trim() === '' ? EMPTY_CODE_MESSAGE : null;
}

// The catalog is closed, so the API answers 404 for a code it does not carry;
// anything else is a transport or server fault the visitor can retry.
export function applyFailureMessage(failure: unknown): string {
  return isApiError(failure) && failure.statusCode === NOT_FOUND
    ? UNKNOWN_CODE_MESSAGE
    : APPLY_FAILED_MESSAGE;
}
