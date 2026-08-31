import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, userEvent, within } from 'storybook/test';
import {
  cartFixture,
  fixedCouponFixture,
  percentageCouponFixture,
} from '@/entities/cart/model/cart.fixture';
import { jsonResponse, stubFetch } from '@/shared/lib/storybookFetch';
import { EMPTY_CODE_MESSAGE, UNKNOWN_CODE_MESSAGE } from '../lib/coupon-errors';
import { OrderSummary } from './OrderSummary';

const ADD_COUPON = 'Add coupon code';
const APPLY = 'Apply';
const COUPON_FIELD = 'Coupon code';
const UNKNOWN_CODE = 'NOSUCHCODE';
const NOT_FOUND = 404;

const COUPONS_PATH = '/coupons';

const couponedCart = {
  ...cartFixture,
  coupons: [percentageCouponFixture, fixedCouponFixture],
};

const meta = {
  title: 'Widgets/OrderSummary',
  component: OrderSummary,
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { mutations: { retry: 0 } } })
        }
      >
        <div style={{ maxWidth: 384 }}>{Story()}</div>
      </QueryClientProvider>
    ),
  ],
  args: { cart: cartFixture },
} satisfies Meta<typeof OrderSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initial: Story = {};

export const CouponFieldOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: ADD_COUPON }));

    await expect(
      canvas.getByRole('textbox', { name: COUPON_FIELD }),
    ).toHaveFocus();
  },
};

export const EmptyCodeError: Story = {
  beforeEach: () =>
    stubFetch(COUPONS_PATH, () => {
      throw new Error('an empty code must not reach the API');
    }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: ADD_COUPON }));
    await userEvent.click(canvas.getByRole('button', { name: APPLY }));

    await expect(canvas.getByText(EMPTY_CODE_MESSAGE)).toBeInTheDocument();
  },
};

export const UnknownCodeError: Story = {
  beforeEach: () =>
    stubFetch(COUPONS_PATH, async () =>
      jsonResponse(
        {
          statusCode: NOT_FOUND,
          message: `Coupon ${UNKNOWN_CODE} not found`,
          error: 'Not Found',
        },
        NOT_FOUND,
      ),
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: ADD_COUPON }));
    await userEvent.type(
      canvas.getByRole('textbox', { name: COUPON_FIELD }),
      UNKNOWN_CODE,
    );
    await userEvent.click(canvas.getByRole('button', { name: APPLY }));

    await expect(
      await canvas.findByText(UNKNOWN_CODE_MESSAGE),
    ).toBeInTheDocument();
  },
};

export const CouponsApplied: Story = {
  args: { cart: couponedCart },
};
