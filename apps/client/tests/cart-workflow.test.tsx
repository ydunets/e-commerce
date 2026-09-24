import type { CartResponseDto } from '@e-commerce/contracts';
import { afterEach, expect, rs, test } from '@rstest/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import {
  CART_QUERY_KEY,
  useAcknowledgeStock,
  useAddToCart,
  useApplyCoupon,
  useCart,
  useCheckoutCart,
  useUpdateCartLine,
} from '@/entities/cart';
import { cartState, setCartState } from '@/entities/cart/lib/cartState';
import {
  clearCartId,
  readCartId,
  storeCartId,
} from '@/entities/cart/lib/cartStorage';
import {
  cartFixture,
  percentageCouponFixture,
} from '@/entities/cart/model/cart.fixture';

const HTTP_OK = 200;
const HTTP_CONFLICT = 409;
const HTTP_UNAVAILABLE = 503;
const SKU = cartFixture.lines[0].sku;
const FINAL_QUANTITY = 4;
const AVAILABLE_QUANTITY = 1;

function response(body: unknown, status = HTTP_OK) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function quantityCart(quantity: number): CartResponseDto {
  return {
    ...cartFixture,
    totalUnits: quantity + cartFixture.lines[1].quantity,
    lines: cartFixture.lines.map((line) =>
      line.sku === SKU ? { ...line, quantity } : line,
    ),
  };
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(CART_QUERY_KEY, cartFixture);
  storeCartId(cartFixture.id);
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  const hooks = renderHook(
    () => ({
      cart: useCart(),
      update: useUpdateCartLine(),
      checkout: useCheckoutCart(),
      acknowledge: useAcknowledgeStock(),
      add: useAddToCart(),
      coupon: useApplyCoupon(),
    }),
    { wrapper: Wrapper },
  );
  return { client, ...hooks };
}

afterEach(() => {
  rs.restoreAllMocks();
  clearCartId();
});

test('checkout flushes a rapid quantity burst and waits for its PATCH before validation', async () => {
  const patch = deferred<Response>();
  const requests: { method: string; body: unknown }[] = [];
  rs.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    requests.push({
      method: init?.method ?? 'GET',
      body: init?.body
        ? JSON.parse(typeof init.body === 'string' ? init.body : '{}')
        : undefined,
    });
    return init?.method === 'PATCH'
      ? patch.promise
      : response({ cart: quantityCart(FINAL_QUANTITY), changes: [] });
  });
  const { result, client } = setup();
  let checkout!: Promise<boolean>;
  act(() => {
    result.current.update.updateQuantity({
      cartId: cartFixture.id,
      sku: SKU,
      quantity: 3,
    });
    result.current.update.updateQuantity({
      cartId: cartFixture.id,
      sku: SKU,
      quantity: FINAL_QUANTITY,
    });
    checkout = result.current.checkout.checkout(cartFixture.id);
  });
  await waitFor(() =>
    expect(requests).toEqual([
      { method: 'PATCH', body: { quantity: FINAL_QUANTITY } },
    ]),
  );
  expect(
    client.getQueryData<CartResponseDto>(CART_QUERY_KEY)?.lines[0]?.quantity,
  ).toBe(FINAL_QUANTITY);
  await act(async () => {
    patch.resolve(response(quantityCart(FINAL_QUANTITY)));
    expect(await checkout).toBe(true);
  });
  expect(requests.map((request) => request.method)).toEqual(['PATCH', 'POST']);
  expect(cartState(client).checkoutCartId).toBe(cartFixture.id);
});

test('checkout waits for a pending coupon write and preserves its discount in the validated cart', async () => {
  const applied = deferred<Response>();
  const withCoupon = { ...cartFixture, coupons: [percentageCouponFixture] };
  const paths: string[] = [];
  rs.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    paths.push(
      typeof url === 'string' ? url : url instanceof URL ? url.href : url.url,
    );
    return (typeof url === 'string'
      ? url
      : url instanceof URL
        ? url.href
        : url.url
    ).endsWith('/coupons')
      ? applied.promise
      : response({ cart: withCoupon, changes: [] });
  });
  const { result, client } = setup();
  let checkout!: Promise<boolean>;
  act(() => {
    result.current.coupon.mutate({
      cartId: cartFixture.id,
      code: percentageCouponFixture.code,
    });
    checkout = result.current.checkout.checkout(cartFixture.id);
  });
  await waitFor(() => expect(paths).toHaveLength(1));
  expect(paths[0]).toContain('/coupons');
  await act(async () => {
    applied.resolve(response(withCoupon));
    expect(await checkout).toBe(true);
  });
  expect(paths[1]).toContain('/validate');
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(withCoupon);
});

test('a queued stock-conflicting write stops checkout and applies server corrections only after acknowledgement', async () => {
  const corrected = quantityCart(AVAILABLE_QUANTITY);
  const paths: string[] = [];
  rs.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    paths.push(
      typeof url === 'string' ? url : url instanceof URL ? url.href : url.url,
    );
    return init?.method === 'PATCH'
      ? response(
          {
            statusCode: HTTP_CONFLICT,
            message: 'Insufficient stock',
            error: 'Conflict',
            details: {
              sku: SKU,
              requested: FINAL_QUANTITY,
              available: AVAILABLE_QUANTITY,
            },
          },
          HTTP_CONFLICT,
        )
      : response({ cart: corrected, changes: [] });
  });
  const { result, client } = setup();
  await act(async () => {
    result.current.update.updateQuantity({
      cartId: cartFixture.id,
      sku: SKU,
      quantity: FINAL_QUANTITY,
    });
    expect(await result.current.checkout.checkout(cartFixture.id)).toBe(false);
  });
  expect(paths).toHaveLength(1);
  expect(cartState(client).stock?.changes[0]).toMatchObject({
    sku: SKU,
    previous_quantity: FINAL_QUANTITY,
    stock: AVAILABLE_QUANTITY,
  });
  expect(
    client.getQueryData<CartResponseDto>(CART_QUERY_KEY)?.lines[0]?.quantity,
  ).toBe(FINAL_QUANTITY);
  act(() => result.current.acknowledge.acknowledge());
  await waitFor(() => expect(cartState(client).stock).toBeNull());
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(corrected);
  expect(paths[1]).toContain('/validate');
  expect(cartState(client).checkoutCartId).toBeNull();
});

test('a failed pending write blocks checkout rather than validating stale intent', async () => {
  const methods: string[] = [];
  rs.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    methods.push(init?.method ?? 'GET');
    return init?.method === 'PATCH'
      ? response({ message: 'Unavailable' }, HTTP_UNAVAILABLE)
      : response(cartFixture);
  });
  const { result, client } = setup();
  await act(async () => {
    result.current.update.updateQuantity({
      cartId: cartFixture.id,
      sku: SKU,
      quantity: FINAL_QUANTITY,
    });
    expect(await result.current.checkout.checkout(cartFixture.id)).toBe(false);
  });
  expect(methods).toEqual(['PATCH', 'GET']);
  expect(cartState(client).error).toContain("Couldn't update");
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(cartFixture);
});

test('checkout stages every clamped or removed line until acknowledgement without a second validate', async () => {
  const corrected = {
    ...quantityCart(AVAILABLE_QUANTITY),
    lines: [quantityCart(AVAILABLE_QUANTITY).lines[0]],
    totalUnits: AVAILABLE_QUANTITY,
  };
  const changes = cartFixture.lines.map((line, index) => ({
    sku: line.sku,
    name: line.name,
    previous_quantity: line.quantity,
    quantity: index === 0 ? AVAILABLE_QUANTITY : 0,
    stock: index === 0 ? AVAILABLE_QUANTITY : 0,
  }));
  const fetch = rs
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(response({ cart: corrected, changes }));
  const { result, client } = setup();
  await act(async () => {
    expect(await result.current.checkout.checkout(cartFixture.id)).toBe(false);
  });
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(cartFixture);
  expect(cartState(client).stock?.changes).toEqual(changes);
  act(() => result.current.acknowledge.acknowledge());
  await waitFor(() => expect(cartState(client).stock).toBeNull());
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(corrected);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('first-ever add conflict has no cart to reconcile and acknowledges without inventing a cart', async () => {
  const fetch = rs.spyOn(globalThis, 'fetch').mockResolvedValue(
    response(
      {
        statusCode: HTTP_CONFLICT,
        message: 'Insufficient stock',
        error: 'Conflict',
        details: { sku: SKU, requested: 1, available: 0 },
      },
      HTTP_CONFLICT,
    ),
  );
  const { result, client } = setup();
  clearCartId();
  client.setQueryData(CART_QUERY_KEY, null);
  act(() => result.current.add.mutate({ sku: SKU, quantity: 1 }));
  await waitFor(() => expect(cartState(client).stock).not.toBeNull());
  act(() => result.current.acknowledge.acknowledge());
  await waitFor(() => expect(cartState(client).stock).toBeNull());
  expect(client.getQueryData(CART_QUERY_KEY)).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('a failed acknowledgement retains the notice and allows retry', async () => {
  const fetch = rs
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      response({ message: 'Unavailable' }, HTTP_UNAVAILABLE),
    )
    .mockResolvedValueOnce(
      response({ cart: quantityCart(AVAILABLE_QUANTITY), changes: [] }),
    );
  const { result, client } = setup();
  setCartState(client, {
    stock: {
      changes: [
        {
          sku: SKU,
          name: 'Voyager Hoodie',
          previous_quantity: FINAL_QUANTITY,
          quantity: AVAILABLE_QUANTITY,
          stock: AVAILABLE_QUANTITY,
        },
      ],
    },
  });
  act(() => result.current.acknowledge.acknowledge());
  await waitFor(() =>
    expect(cartState(client).error).toContain("Couldn't refresh stock"),
  );
  expect(cartState(client).stock).not.toBeNull();
  act(() => result.current.acknowledge.acknowledge());
  await waitFor(() => expect(cartState(client).stock).toBeNull());
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('a delayed cart read cannot overwrite an acknowledged stock correction', async () => {
  const staleRead = deferred<CartResponseDto>();
  rs.spyOn(globalThis, 'fetch').mockResolvedValue(
    response({ cart: quantityCart(AVAILABLE_QUANTITY), changes: [] }),
  );
  const { result, client } = setup();
  const fetching = client
    .fetchQuery({ queryKey: CART_QUERY_KEY, queryFn: () => staleRead.promise })
    .catch(() => undefined);
  setCartState(client, {
    stock: {
      changes: [
        {
          sku: SKU,
          name: 'Voyager Hoodie',
          previous_quantity: FINAL_QUANTITY,
          quantity: AVAILABLE_QUANTITY,
          stock: AVAILABLE_QUANTITY,
        },
      ],
    },
  });
  act(() => result.current.acknowledge.acknowledge());
  await waitFor(() => expect(cartState(client).stock).toBeNull());
  await act(async () => {
    staleRead.resolve(cartFixture);
    await fetching;
  });
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(
    quantityCart(AVAILABLE_QUANTITY),
  );
});

test('a delayed initial read cannot overwrite a successful add', async () => {
  const staleRead = deferred<CartResponseDto>();
  const updated = quantityCart(FINAL_QUANTITY);
  rs.spyOn(globalThis, 'fetch').mockResolvedValue(response(updated));
  const { result, client } = setup();
  const fetching = client
    .fetchQuery({ queryKey: CART_QUERY_KEY, queryFn: () => staleRead.promise })
    .catch(() => undefined);
  act(() => result.current.add.mutate({ sku: SKU, quantity: 2 }));
  await waitFor(() => expect(result.current.add.isSuccess).toBe(true));
  await act(async () => {
    staleRead.resolve(cartFixture);
    await fetching;
  });
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(updated);
});

test('a response for an earlier quantity preserves the later optimistic intent', async () => {
  const firstWrite = deferred<Response>();
  const nextWrite = deferred<Response>();
  const patchQuantities: number[] = [];
  rs.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    if (init?.method === 'PATCH') {
      patchQuantities.push(
        JSON.parse(typeof init.body === 'string' ? init.body : '{}').quantity,
      );
      return patchQuantities.length === 1
        ? firstWrite.promise
        : nextWrite.promise;
    }
    return response({ cart: quantityCart(FINAL_QUANTITY), changes: [] });
  });
  const { result, client } = setup();
  act(() =>
    result.current.update.updateQuantity({
      cartId: cartFixture.id,
      sku: SKU,
      quantity: 3,
    }),
  );
  await waitFor(() => expect(patchQuantities).toEqual([3]));
  let checkout!: Promise<boolean>;
  act(() => {
    result.current.update.updateQuantity({
      cartId: cartFixture.id,
      sku: SKU,
      quantity: FINAL_QUANTITY,
    });
    checkout = result.current.checkout.checkout(cartFixture.id);
  });
  await act(async () => {
    firstWrite.resolve(response(quantityCart(3)));
  });
  await waitFor(() => expect(patchQuantities).toEqual([3, FINAL_QUANTITY]));
  expect(
    client.getQueryData<CartResponseDto>(CART_QUERY_KEY)?.lines[0]?.quantity,
  ).toBe(FINAL_QUANTITY);
  await act(async () => {
    nextWrite.resolve(response(quantityCart(FINAL_QUANTITY)));
    expect(await checkout).toBe(true);
  });
});

test('a late old-cart 404 cannot erase the id minted by a self-healing add', async () => {
  const HTTP_NOT_FOUND = 404;
  const NEW_CART_ID = '83642895-a16e-4bc8-8542-6c328382aacc';
  const staleRead = deferred<Response>();
  const minted = { ...quantityCart(FINAL_QUANTITY), id: NEW_CART_ID };
  const fetch = rs
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (_url, init) => {
      if (init?.method !== 'POST') return staleRead.promise;
      const body = JSON.parse(typeof init.body === 'string' ? init.body : '{}');
      return body.cartId
        ? response(
            {
              statusCode: HTTP_NOT_FOUND,
              message: 'Cart not found',
              error: 'Not Found',
            },
            HTTP_NOT_FOUND,
          )
        : response(minted);
    });
  const { result, client } = setup();
  let reading!: ReturnType<typeof result.current.cart.refetch>;
  act(() => {
    reading = result.current.cart.refetch();
  });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  act(() => result.current.add.mutate({ sku: SKU, quantity: FINAL_QUANTITY }));
  await waitFor(() => expect(result.current.add.isSuccess).toBe(true));
  expect(readCartId()).toBe(NEW_CART_ID);
  await act(async () => {
    staleRead.resolve(
      response(
        {
          statusCode: HTTP_NOT_FOUND,
          message: 'Old cart not found',
          error: 'Not Found',
        },
        HTTP_NOT_FOUND,
      ),
    );
    await reading;
  });
  expect(readCartId()).toBe(NEW_CART_ID);
  expect(client.getQueryData(CART_QUERY_KEY)).toEqual(minted);
});

test('queued 2 then 3 then 2 writes preserve the latest intent despite equal earlier quantities', async () => {
  const FIRST_QUANTITY = 2;
  const MIDDLE_QUANTITY = 3;
  const firstWrite = deferred<Response>();
  const middleWrite = deferred<Response>();
  const lastWrite = deferred<Response>();
  const replies = [firstWrite, middleWrite, lastWrite];
  const requests: number[] = [];
  rs.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    if (init?.method !== 'PATCH')
      return response({ cart: quantityCart(FIRST_QUANTITY), changes: [] });
    const body = JSON.parse(typeof init.body === 'string' ? init.body : '{}');
    requests.push(body.quantity);
    return replies[requests.length - 1].promise;
  });
  const { result, client } = setup();
  const update = (quantity: number) =>
    result.current.update.updateQuantity({
      cartId: cartFixture.id,
      sku: SKU,
      quantity,
    });
  act(() => update(FIRST_QUANTITY));
  await waitFor(() => expect(requests).toEqual([FIRST_QUANTITY]));
  act(() => update(MIDDLE_QUANTITY));
  // The middle debounced write must enter the mutation queue while the first
  // request is still pending. Checkout later flushes the final intention.
  await waitFor(() =>
    expect(
      client
        .getMutationCache()
        .getAll()
        .filter((mutation) => mutation.state.status === 'pending'),
    ).toHaveLength(2),
  );
  let checkout!: Promise<boolean>;
  act(() => {
    update(FIRST_QUANTITY);
    checkout = result.current.checkout.checkout(cartFixture.id);
  });
  await act(async () => {
    firstWrite.resolve(response(quantityCart(FIRST_QUANTITY)));
  });
  await waitFor(() =>
    expect(requests).toEqual([FIRST_QUANTITY, MIDDLE_QUANTITY]),
  );
  await act(async () => {
    middleWrite.resolve(response(quantityCart(MIDDLE_QUANTITY)));
  });
  await waitFor(() =>
    expect(requests).toEqual([FIRST_QUANTITY, MIDDLE_QUANTITY, FIRST_QUANTITY]),
  );
  expect(
    client.getQueryData<CartResponseDto>(CART_QUERY_KEY)?.lines[0]?.quantity,
  ).toBe(FIRST_QUANTITY);
  await act(async () => {
    lastWrite.resolve(response(quantityCart(FIRST_QUANTITY)));
    expect(await checkout).toBe(true);
  });
});
