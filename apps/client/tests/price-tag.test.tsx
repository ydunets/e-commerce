import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { isDiscounted, type Price } from '@/shared/lib/price';
import { PriceTag } from '@/shared/ui/price-tag';

const SALE_PRICE = 76;
const LIST_PRICE = 95;
const DISCOUNT = 20;

const ON_SALE: Price = {
  sale: SALE_PRICE,
  list: LIST_PRICE,
  discountPercentage: DISCOUNT,
};
const FULL_PRICE: Price = {
  sale: LIST_PRICE,
  list: LIST_PRICE,
  discountPercentage: null,
};

test('a discounted price shows sale, original, and the badge', () => {
  render(<PriceTag price={ON_SALE} />);

  expect(screen.getByText(`$${SALE_PRICE}`)).toBeInTheDocument();
  expect(screen.getByText(new RegExp(`\\$${LIST_PRICE}`))).toHaveTextContent(
    `Original price $${LIST_PRICE}`,
  );
  expect(screen.getByText(`${DISCOUNT}% OFF`)).toBeInTheDocument();
});

test('a full price shows only the sale price', () => {
  render(<PriceTag price={FULL_PRICE} />);

  expect(screen.getByText(`$${LIST_PRICE}`)).toBeInTheDocument();
  expect(screen.queryByText(/OFF/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Original price/)).not.toBeInTheDocument();
});

test('a discount percentage without an actual markdown is ignored', () => {
  render(<PriceTag price={{ ...FULL_PRICE, discountPercentage: DISCOUNT }} />);

  expect(screen.queryByText(/OFF/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Original price/)).not.toBeInTheDocument();
});

test('isDiscounted requires a positive percentage and a real markdown', () => {
  expect(isDiscounted(ON_SALE)).toBe(true);
  expect(isDiscounted(FULL_PRICE)).toBe(false);
  expect(isDiscounted({ ...ON_SALE, discountPercentage: null })).toBe(false);
  expect(isDiscounted({ ...ON_SALE, discountPercentage: 0 })).toBe(false);
  expect(isDiscounted({ ...FULL_PRICE, discountPercentage: DISCOUNT })).toBe(
    false,
  );
});
