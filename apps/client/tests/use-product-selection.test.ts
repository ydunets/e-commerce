import { expect, test } from '@rstest/core';
import { act, renderHook } from '@testing-library/react';
import { productFixture } from '../src/entities/product/model/product.fixture';
import type { DemoState } from '../src/widgets/product-details/lib/product-display';
import { useProductSelection } from '../src/widgets/product-details/lib/useProductSelection';

const COLOR_GREEN = 'green';
const COLOR_BROWN = 'brown';
const SIZE_SM = 'sm';
const SIZE_MD = 'md';

const DEMO_DEFAULT: DemoState = 'default';
const DEMO_OUT_OF_STOCK: DemoState = 'out-of-stock';

const RESET_QUANTITY = 1;
const EMPTY = 0;

// Expected stock is derived from the fixture rather than hard-coded, so the
// tests stay correct if the fixture changes.
const stockFor = (color: string, size: string) =>
  productFixture.variants.find(
    (variant) => variant.color === color && variant.size === size,
  )?.stock ?? 0;

const renderSelection = (demoState: DemoState = DEMO_DEFAULT) =>
  renderHook(() => useProductSelection(productFixture, demoState));

// `act` is required here (and only here): each call imperatively drives a hook
// state update outside React's event system, which the component tests avoid by
// going through userEvent. See docs/tests/best-practices.md.

test('initial selection picks the first colour and its first size', () => {
  const { result } = renderSelection();

  expect(result.current.selectedColor).toBe(COLOR_GREEN);
  expect(result.current.selectedSize).toBe(SIZE_SM);
  expect(result.current.isOutOfStock).toBe(false);
});

test('selecting a colour resets the size to the first in-stock option and the quantity', () => {
  const { result } = renderSelection();

  act(() => result.current.setQuantity(stockFor(COLOR_GREEN, SIZE_SM)));
  act(() => result.current.selectColor(COLOR_BROWN));

  expect(result.current.selectedColor).toBe(COLOR_BROWN);
  expect(result.current.selectedSize).toBe(SIZE_SM);
  expect(result.current.displayedQuantity).toBe(RESET_QUANTITY);
});

test('selecting a smaller-stock size clamps the quantity down to it', () => {
  const { result } = renderSelection();
  const brownMdStock = stockFor(COLOR_BROWN, SIZE_MD);
  const brownSmStock = stockFor(COLOR_BROWN, SIZE_SM);

  act(() => result.current.selectColor(COLOR_BROWN));
  act(() => result.current.selectSize(SIZE_MD));
  act(() => result.current.setQuantity(brownMdStock));
  act(() => result.current.selectSize(SIZE_SM));

  expect(result.current.displayedQuantity).toBe(brownSmStock);
  expect(result.current.maxStock).toBe(brownSmStock);
});

test('the out-of-stock demo state zeroes the displayed quantity and max', () => {
  const { result } = renderSelection(DEMO_OUT_OF_STOCK);

  expect(result.current.isOutOfStock).toBe(true);
  expect(result.current.displayedQuantity).toBe(EMPTY);
  expect(result.current.maxStock).toBe(EMPTY);
});
