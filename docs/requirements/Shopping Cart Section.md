# Shopping Cart Section

## Project brief

In this challenge, you will develop a fully functional and responsive shopping cart interface for a fictional e-commerce platform.

You will be provided with designs that have been adapted for mobile, tablet, and desktop interfaces. You will also be provided with data corresponding to product listings, as well as a sample order that you will display in the shopping cart.

As per standard shopping carts, the interface should allow users to add items, modify quantity, remove items, and view an order summary including subtotal, shipping, and total cost. Users should also be able to add a coupon discount code to their order. When you work on the E-commerce website challenge, you will have to dynamically update the user's shopping cart when the user modifies their cart anywhere on the e-commerce platform, and display the same cart contents on the Checkout page when the user clicks the "Checkout" button.

## Implementation requirements

This is a complex challenge with many sections and components, please read the requirements carefully.

### General layout

- **Structure**: The page is divided into two main columns.
  - **Left section**: Cart items.
  - **Right section**: Order summary.
- **Empty state**: If there are no items in the cart, the empty state should be displayed.

### Cart items (left column)

- **Default sort**: Latest item added to cart first.
- **Item denomination**: Each product variant that has been added to cart should be displayed separately instead of bundled into 1 product. For e.g., if I added both Orange and Pink StepSoft socks, they should be displayed as separate rows in the cart.
- **Item name and image**: Item name and images should be clickable and link to the product detail page. The image displayed should correspond to the variant added to cart.
- **List price vs Sale price**: If there is a platform discount available, display the list price with a strikethrough. Otherwise, display only the list price.
- **Quantity selector**: "-" and "+" buttons control the quantity of the item.
  - Quantity can only be decreased till 1, after which the user has to click "Remove" to remove the item from cart.
  - Quantity can only be increased till the maximum stock available. When the maximum stock is reached, the "+" icon should be disabled, with an 'Insufficient stock' tooltip.
- **"Remove" link**:
  - A clickable text link that removes the item from the cart.
  - Clicking on it triggers a confirmation prompt as per the provided design, to prevent accidental removals.

### Order summary section

- **Real-time calculation**: Subtotal, shipping fees and total cost should be calculated automatically and real-time as item quantities and coupon codes are modified. You may assume shipping is always FREE for this case.
- **"Add coupon code" button**:
  - **Before clicking on the button**: Implement states before it is clicked, including normal, hover, focus, and disabled.
  - **After clicking on the button**: After the user clicks on it, it should become an input field with an "Apply" button.
- **"Add coupon code" field**:
  - **States**: Implement the input field states in normal, filled, focus, disabled, error, error filled and error focused states (also the 'Apply' button states).
  - **On clicking "Apply"**:
    - If no coupon code was entered: Give error "Please enter a valid code".
    - If coupon code does not exist: Give error "Sorry, but this coupon doesn't exist".
    - If the coupon code exists: It should give a success state wherein the coupon code is displayed as a tag under the field, and the discount amount is added under the subtotal.
  - **On clicking "x" on the applied coupons**: Remove the coupon from the order summary.

### Stock validation and updates

- **Real-time stock validation on item quantity update by user**: As soon as a product is added to the cart or the quantity is updated in the cart, you should validate the stock availability asynchronously. If the available stock has changed, you should pop a modal as per the provided design for 'Insufficient stock'. This informs the user that there has been a change in stock. After the user clicks 'Ok', update the shopping cart with the new values.
- **Stock validation on checkout**: When the user clicks "Checkout", you should validate the stock availability of all items in cart. If there has been a change of stock, you should pop a modal as per the provided design for 'Insufficient stock'. This informs the user that there has been a change in stock. After the user clicks 'Ok', update the shopping cart with the new values.
- **[Stretch goal] Stock reservation**: To prevent concurrency issues where multiple customers attempt to buy the last units of a product, we can reserve the stock upon after the user clicks "Checkout". This should be time limited to prevent stock inaccuracies due to cart abandonment.

### General requirements

- **Design fidelity**: Aim to follow the design as closely as possible. All elements in the design should be present, using the specified text color, font size, font weight, spacing, dimensions, etc.
- **Responsive behavior**: The content should stack vertically on smaller screens and align horizontally as the screen width increases.
- **Cross-browser compatibility**: Check that your solution works for major browsers including Chrome, Firefox, and Safari.
- **[Stretch goal] Performance optimization**: Code for fast load times with efficient CSS and JavaScript techniques.
- **[Stretch goal] Accessibility and semantics**: Follow best practices for web accessibility, such as using semantic HTML and ARIA roles where necessary and using proper alt tags for images.

## Figma references

- [Shopping cart section design](https://www.figma.com/design/VzOxaogZpKbQOxx8li1uFR/shopping-cart-section-figma?node-id=0-1&p=f&m=dev)

## Decisions (grilling session, 2026-08-26)

### Scope

- All three surfaces are in scope: the cart page, platform-wide cart
  synchronization, and the checkout page displaying the same cart contents.
- Accessibility is committed: `/cart` and `/checkout` join the e2e a11y
  budgets. The stock-reservation stretch goal is deferred to its own ticket.
  Performance remains a byproduct of a sane implementation, not a workstream.
- Figma (dev mode) is the design source of truth; frames are extracted per
  breakpoint and mapped onto existing client primitives.
- Add-to-cart stays on the product detail page only. "Dynamically update the
  cart anywhere" is satisfied by the shared `['cart']` query cache (navbar
  badge, cart page, checkout); no card-level variant picker is built.

### Cart read model

- `GET /api/v1/carts/:cartId` is enriched server-side: the repository joins
  `cart_lines` to `product_inventory` and `products`, and each line gains
  name, variant image, list price, sale price, available stock, and
  `productId` for the detail-page link. `cartResponseDtoSchema` in
  `@e-commerce/contracts` is updated accordingly (its only consumers are this
  client and the e2e specs).
- Lines are ordered by `cart_lines.created_at DESC` (latest added first).
- Subtotal, discount, and total are derived during render from the enriched
  lines through one pure, unit-tested pricing helper shared by the cart and
  checkout pages. Shipping is always free. The server returns each applied
  coupon's discount definition; the client applies the arithmetic.

### Coupons

- Coupon ownership lives inside the existing `cart` module; no separate
  coupon module and no CQRS bus hop until an admin or catalog surface exists.
- Tables: `coupons` (code PK, `discount_type` percentage or fixed, value) as
  seed data with at least one code of each type, and `cart_coupons`
  (`cart_id`, `code`) with per-code uniqueness. Multiple coupons stack.
- `POST /api/v1/carts/:cartId/coupons` applies a code;
  `DELETE /api/v1/carts/:cartId/coupons/:code` removes it. The cart response
  returns the applied coupons with their discount definitions.
- Validation is existence-only, matching the two error copies in the brief;
  no expiry or usage-limit logic.

### Stock validation

- Write-path 409 responses gain a structured payload carrying the available
  stock per SKU instead of a prose-only message; the client mutation handlers
  render the "Insufficient stock" modal directly from it.
- `POST /api/v1/carts/:cartId/validate` reconciles the whole cart
  transactionally server-side (clamping quantities, removing sold-out lines)
  and returns the corrected cart plus a delta report. Checkout calls it;
  after the user confirms the modal, the server-corrected cart replaces the
  cached one. Server-side clamping is authoritative because a client resubmit
  can race a second stock change.

### Checkout

- `/checkout` is a read-only route rendering lines, totals, and applied
  coupons from the same query cache, reachable only after a clean reconcile.
  No orders table, no payment or address forms, no order creation.

### Client state and reuse

- TanStack Query remains the only cart state (reaffirming the storefront
  decision); the cart page fetches client-side and SSR renders the shell.
- `apiPatch` and `apiDelete` are added to `shared/api`;
  `useUpdateCartItem` and `useRemoveCartItem` join `entities/cart`.
- Reused primitives: `QuantityStepper` (max plus tooltip already built),
  `Dialog` (remove confirmation and stock modals), `Tooltip`, `TextInput`
  (extended with the applied-coupon tag state), `PriceTag`. Vocabulary
  follows CONTEXT.md: cart line, cart count.
- Quantity mutations are debounced (about 300 ms) inside `useUpdateCartItem`
  with an optimistic stepper: a burst of clicks collapses into one PATCH
  carrying the final absolute quantity, and the settled response reconciles
  the cache.
- The Guides section below is vendor boilerplate from the challenge. Its
  `useEffect`-driven recalculation examples and GreatFrontend API endpoints
  do not apply: totals are derived during render per the repository's effect
  discipline, and all requests target this project's own Fastify API.

### Delivery

- Tracked by issue #58, with one sub-issue per stage: #59 (server API),
  #60 (cart page), #61 (coupons and order summary), #62 (stock modals and
  checkout), #63 (e2e coverage).
- Stacked PRs branched from `origin/main`: (1) contracts plus server work
  (read-model enrichment, structured 409, coupons, reconcile endpoint; may
  split into atomic PRs per module boundary), (2) cart page UI with quantity
  and remove flows, (3) coupon field and order summary states, (4) stock
  modals and the checkout page, (5) e2e specs, visual baselines with aria
  snapshots, and a11y budget entries for the new routes.

## Guides

These guides help you get started on the trickier portions of the challenge and are not meant to be exhaustive. However, do let us know what other guidance you'd benefit from and we can add it in.

This challenge requires understanding of various fundamental web development concepts including data fetching from APIs, handling loading and error states, and implementing modals.

### Relevant concepts

- **Fetching data from external APIs**: Fetching data from APIs is a crucial aspect of modern web applications. It involves making HTTP requests to an external server to retrieve data which can then be displayed in the application. This is particularly relevant for dynamic content like a shopping cart, where product data and cart details need to be fetched and displayed to the user. Understanding how to handle these requests, managed fetched data, and appropriately handle caching, loading, and error states is integral to creating interactive experiences on the web.
- **Loading and error states**: When fetching data from an API, there is always a possibility of delays or errors. Loading states provide feedback to the user that data is being fetched, preventing confusion or frustration. Error states handle scenarios where the data fetch fails, providing appropriate messages to guide the user.
- **Modals and dialogs**: Modals and dialogs are common UI components used to display information or capture user input without navigating away from the current page. In the context of a shopping cart, modals can be used for confirming actions like removing items or informing the user about stock availability.

### Recommended approach

#### Displaying products

To display products in the shopping cart, you need to handle different item denominations separately. Simply mapping out the items in the cart array is insufficient because each product variant (e.g., different sizes or colors) should be displayed as separate items.

**Generate a New Array for Item Denominations**: Create a function that iterates through the cart items and generates a new array where each product variant is treated as a separate item. This ensures that different denominations are displayed correctly in the cart.

```js
// Example function to generate new array with separate variants of a product separated into their own listing.
function getCartItemsWithVariants(cartItems) {
  let itemsWithVariants = [];
  cartItems.forEach((item) => {
    item.variants.forEach((variant) => {
      itemsWithVariants.push({
        item,
        variant,
      });
    });
  });
  return itemsWithVariants;
}
```

**Map Out the Items**: Use this new array to map out each item in the cart, ensuring that each variant is displayed as a separate row.

```jsx
<div id="cart-items">
  {cartItemsWithVariants.map(({item, variant}) => (
  <CartProduct item="{item}" variant="{variant}" />
  ))}
</div>
```

#### Price calculations

To ensure real-time price calculations, maintain a state or variable that updates automatically whenever there is a change in the cart, such as when a user changes the quantity of an item or adds a new product.

**Update Price in Real-Time**: Calculate the total price using a function that sums up the prices of all items in the cart. This function should be called every time there is a change in the cart. Using patterns such as `Array.prototype.reduce()` is a quick and simple way to quickly calculate values derived from an array.

```js
function calculateTotal(cartItems) {
  return cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}
```

**Implementing the Calculation**: Use a state management system (like React's `useState` and `useEffect`) to automatically update the price whenever the cart items change.

```js
const [total, setTotal] = useState(0);

useEffect(() => {
  setTotal(calculateTotal(cartItems));
}, [cartItems]);
```

**For React**: Alternatively, simply use a variable in the component as the calculation isn't particularly heavy and doesn't add on much extra computation load.

```js
const total = calculateTotal(cartItems);
```

#### Coupon code handling

Implementing coupon codes involves creating a handler function that validates the coupon code and applies the discount accordingly. The discount can be stored in a separate state.

Ideally, the discounts should be applied server-side, then sent back to the client with the updated price to prevent the user tampering with the discount values. However, in our situation, we simply apply the discount on the client side to simulate this process.

For the coupon code handler, create a function to handle the validation and application of the coupon code. The function should handle loading, error, and success states. With this function, the function that calculates the cart total can be modified to factor in discounts.

```js
// Example using React to handle fetching coupon code information
async function applyCoupon(code) {
  setLoading(true);
  try {
    const response = await fetch(
      `https://www.greatfrontend.com/api/projects/challenges/e-commerce/coupons/apply?coupon_code=${code}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const data = await response.json();
    if (data.error) {
      // handle error...
    } else {
      setDiscount(data);
    }
  } catch (error) {
    // handle error...
  }
}
```

#### Stock handling

Stock handling requires validating the stock every time there is an update to the cart, such as changing the quantity or variant of a product.

**Validate stock**: Create a function to check the stock availability whenever there is a change in the cart. This handler should be called every time the quantity of any product in the cart gets updated.

```js
async function validateStock(cartItems) {
  const response = await fetch(
    `https://www.greatfrontend.com/api/projects/challenges/e-commerce/products/voyager-hoodie`,
    {
      method: 'POST',
      body: JSON.stringify(cartItems),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  const { inventory } = await response.json();
  // calculate stock for relevant variants...
}
```

**Show modal for insufficient stock**: Display a modal to inform the user about insufficient stock and update the cart accordingly. This modal can be manually programmed in to become visible whenever needed through a state, or other external libraries / component libraries can be utilized to make this simpler.

```jsx
// Example React code for conditionally displaying a modal
const [isModalOpen, setIsModalOpen] = useState(false);

useEffect(() => {
  // some code handling updates...
  if (quantity > stockStillLeft) {
    isModalOpen(true);
    // code to revert the qty modification
  }
});
return (
  <div>
    {isModalOpen && (
      <div className="modal-backdrop">
        <div className="modal">
          <p>We don't have stock for this product!</p>
          <button onClick={closeModal}>Got it</button>
        </div>
      </div>
    )}
  </div>
);
```

### Further considerations

#### Debouncing

When users rapidly update their cart, it can cause the API to fire multiple requests in quick succession. Implementing debouncing helps to limit the number of API requests by grouping multiple changes into a single request. There are several libraries designed to handle this, e.g. `useDebounce` is a simple utility function for getting debounced values from another state.
