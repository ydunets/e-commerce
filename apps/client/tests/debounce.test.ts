import { afterEach, expect, rstest, test } from '@rstest/core';
import { debounce } from '../src/shared/lib/debounce';

const DELAY_MS = 300;

afterEach(() => {
  rstest.useRealTimers();
});

test('collapses a burst into one trailing call with the last arguments', () => {
  rstest.useFakeTimers();
  const calls: number[] = [];
  const record = debounce((value: number) => calls.push(value), DELAY_MS);

  record(1);
  record(2);
  record(3);

  rstest.advanceTimersByTime(DELAY_MS - 1);
  expect(calls).toEqual([]);

  rstest.advanceTimersByTime(1);
  expect(calls).toEqual([3]);
});

test('cancel drops the pending call and later calls still fire', () => {
  rstest.useFakeTimers();
  const calls: number[] = [];
  const record = debounce((value: number) => calls.push(value), DELAY_MS);

  record(1);
  record.cancel();
  rstest.advanceTimersByTime(DELAY_MS);
  expect(calls).toEqual([]);

  record(2);
  rstest.advanceTimersByTime(DELAY_MS);
  expect(calls).toEqual([2]);
});
