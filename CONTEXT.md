# StyleNest E-Commerce

An e-commerce storefront (StyleNest catalog) with a Fastify API and a React SSR client. Products are sold in color/size variants tracked as inventory rows.

## Language

**Product**:
A sellable catalog item (e.g. "Voyager Hoodie") identified by a slug-like `product_id`. A product belongs to one category and one collection and has one or more color variants.

**Color variant**:
The set of inventory items and images of a product sharing one color. Cards and swatches operate on color variants, not individual SKUs.
_Avoid_: Variation, colorway

**Inventory item**:
A purchasable unit of a product in a specific color and size, identified by SKU, carrying its own list price, discount, sale price, and stock.
_Avoid_: SKU (as a concept name; SKU is the identifier)

**Latest Arrivals**:
The 8 newest products by `created_at` descending (ties broken by `product_id`). A view of the catalog, not a curated set.
_Avoid_: New arrivals, featured products

**Out of stock (color)**:
A color variant whose sizes all have zero stock. Out-of-stock colors remain viewable and selectable in the UI.

**Card price**:
The price a product card shows for a color variant: the lowest sale price among that color's sizes, struck against its corresponding list price when discounted.
_Avoid_: From-price, starting price

**Swatch**:
The clickable color dot on a product card. Selecting a swatch switches the card's displayed color variant (image, color label, price). States: normal, hover, focus, selected, out-of-stock, selected out-of-stock.

**Category**:
A top-level audience grouping of products: men, women, unisex.

**Collection**:
A themed grouping of products (e.g. "Urban Oasis"), independent of category.
