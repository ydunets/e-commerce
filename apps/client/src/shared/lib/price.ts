export interface Price {
  sale: number;
  list: number;
  discountPercentage: number | null;
}

export function isDiscounted(price: Price): boolean {
  return (
    price.discountPercentage !== null &&
    price.discountPercentage > 0 &&
    price.sale < price.list
  );
}
