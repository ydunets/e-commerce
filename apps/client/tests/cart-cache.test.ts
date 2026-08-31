import { expect, test } from '@rstest/core';
import { withLineQuantity } from '../src/entities/cart/lib/cartCache';
import {
  cartFixture,
  discountedCartLineFixture,
  fullPriceCartLineFixture,
} from '../src/entities/cart/model/cart.fixture';

const NEXT_QUANTITY = 5;

test('sets the target line quantity and recomputes the total units', () => {
  const next = withLineQuantity(
    cartFixture,
    discountedCartLineFixture.sku,
    NEXT_QUANTITY,
  );

  const patched = next.lines.find(
    (line) => line.sku === discountedCartLineFixture.sku,
  );
  expect(patched?.quantity).toBe(NEXT_QUANTITY);
  expect(next.totalUnits).toBe(
    NEXT_QUANTITY + fullPriceCartLineFixture.quantity,
  );
});

test('leaves the other lines and the input cart untouched', () => {
  const next = withLineQuantity(
    cartFixture,
    discountedCartLineFixture.sku,
    NEXT_QUANTITY,
  );

  const untouched = next.lines.find(
    (line) => line.sku === fullPriceCartLineFixture.sku,
  );
  expect(untouched).toEqual(fullPriceCartLineFixture);
  expect(cartFixture.lines[0].quantity).toBe(
    discountedCartLineFixture.quantity,
  );
  expect(cartFixture.totalUnits).toBe(
    discountedCartLineFixture.quantity + fullPriceCartLineFixture.quantity,
  );
});
