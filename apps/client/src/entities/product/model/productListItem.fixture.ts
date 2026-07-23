import type { ProductListItem } from './types';

/** Full price, two in-stock colours — the plain default state. */
export const productListItemFixture: ProductListItem = {
  id: 'voyager-hoodie',
  name: 'Voyager Hoodie',
  colors: [
    {
      color: 'green',
      imageUrl: 'https://picsum.photos/seed/vh-green/600',
      price: { sale: 95, list: 95, discountPercentage: null },
      outOfStock: false,
    },
    {
      color: 'brown',
      imageUrl: 'https://picsum.photos/seed/vh-brown/600',
      price: { sale: 76, list: 95, discountPercentage: 20 },
      outOfStock: false,
    },
  ],
};

/** Default colour is on sale, struck against its list price. */
export const discountedProductListItemFixture: ProductListItem = {
  ...productListItemFixture,
  colors: [productListItemFixture.colors[1], productListItemFixture.colors[0]],
};

/** One colour only — the swatch row still renders a single dot. */
export const singleColorProductListItemFixture: ProductListItem = {
  id: 'tangerine-mini-tote',
  name: 'Tangerine Mini Tote',
  colors: [
    {
      color: 'orange',
      imageUrl: 'https://picsum.photos/seed/tmt-orange/600',
      price: { sale: 150, list: 150, discountPercentage: null },
      outOfStock: false,
    },
  ],
};

/** The second, non-default colour is sold out but stays selectable. */
export const outOfStockColorProductListItemFixture: ProductListItem = {
  id: 'classic-canvas-tee',
  name: 'Classic Canvas Tee',
  colors: [
    {
      color: 'white',
      imageUrl: 'https://picsum.photos/seed/cct-white/600',
      price: { sale: 22.5, list: 25, discountPercentage: 10 },
      outOfStock: false,
    },
    {
      color: 'beige',
      imageUrl: 'https://picsum.photos/seed/cct-beige/600',
      price: { sale: 22.5, list: 25, discountPercentage: 10 },
      outOfStock: true,
    },
  ],
};

/** The default (first) colour itself is sold out, so it renders selected. */
export const selectedOutOfStockProductListItemFixture: ProductListItem = {
  ...outOfStockColorProductListItemFixture,
  colors: [
    outOfStockColorProductListItemFixture.colors[1],
    outOfStockColorProductListItemFixture.colors[0],
  ],
};
