import { expect, test } from '@rstest/core';
import { ApiError } from '../src/shared/api';
import {
  APPLY_FAILED_MESSAGE,
  applyFailureMessage,
  EMPTY_CODE_MESSAGE,
  UNKNOWN_CODE_MESSAGE,
  validateCouponCode,
} from '../src/widgets/order-summary/lib/coupon-errors';

const CODE = 'WELCOME15';
const BLANK = '   ';
const EMPTY = '';
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

const apiError = (statusCode: number): ApiError =>
  new ApiError({ statusCode, message: 'Coupon not found', error: 'Not Found' });

test('rejects an empty code with the copy the brief specifies', () => {
  expect(validateCouponCode(EMPTY)).toBe(EMPTY_CODE_MESSAGE);
  expect(EMPTY_CODE_MESSAGE).toBe('Please enter a valid code');
});

test('rejects a code of nothing but whitespace', () => {
  expect(validateCouponCode(BLANK)).toBe(EMPTY_CODE_MESSAGE);
});

test('accepts a code the server can look up', () => {
  expect(validateCouponCode(CODE)).toBeNull();
});

test('reports a 404 with the copy the brief specifies', () => {
  expect(applyFailureMessage(apiError(NOT_FOUND))).toBe(UNKNOWN_CODE_MESSAGE);
  expect(UNKNOWN_CODE_MESSAGE).toBe("Sorry, but this coupon doesn't exist");
});

test('reports any other API failure as retryable', () => {
  expect(applyFailureMessage(apiError(SERVER_ERROR))).toBe(
    APPLY_FAILED_MESSAGE,
  );
});

test('reports a failure that never reached the API as retryable', () => {
  expect(applyFailureMessage(new Error('offline'))).toBe(APPLY_FAILED_MESSAGE);
});
