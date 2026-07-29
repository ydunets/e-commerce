import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { NewsletterForm } from './NewsletterForm';

const VALID_EMAIL = 'jane@example.com';
const MALFORMED_EMAIL = 'jane@example';
const REQUIRED_MESSAGE = 'Email address is required.';
const FORMAT_MESSAGE = 'Please enter a valid email address.';
const SUCCESS_MESSAGE =
  'Subscription successful! Please check your email to confirm.';
const FAILURE_MESSAGE =
  'Failed to subscribe. Please ensure your email is correct or try again later.';

const SUBSCRIPTIONS_PATH = '/api/v1/newsletter/subscriptions';

// Scoped to the subscribe endpoint only: a blanket `window.fetch` override
// also breaks the dev server's own HMR fetches and triggers full reloads.
function stubFetch(handler: typeof fetch) {
  const original = window.fetch;
  window.fetch = ((input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    return url.includes(SUBSCRIPTIONS_PATH)
      ? handler(input, init)
      : original(input, init);
  }) as typeof fetch;
  return () => {
    window.fetch = original;
  };
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const meta = {
  title: 'Widgets/NewsletterForm',
  component: NewsletterForm,
} satisfies Meta<typeof NewsletterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  beforeEach: () =>
    stubFetch(() => {
      throw new Error('the empty field must not reach the API');
    }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Subscribe' }));

    await expect(canvas.getByText(REQUIRED_MESSAGE)).toBeInTheDocument();
  },
};

export const Malformed: Story = {
  beforeEach: () =>
    stubFetch(() => {
      throw new Error('a malformed email must not reach the API');
    }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox');

    await userEvent.type(field, MALFORMED_EMAIL);
    await userEvent.click(canvas.getByRole('button', { name: 'Subscribe' }));

    await expect(canvas.getByText(FORMAT_MESSAGE)).toBeInTheDocument();
  },
};

export const Success: Story = {
  beforeEach: () =>
    stubFetch(async () => jsonResponse({ message: SUCCESS_MESSAGE }, 200)),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox');

    await userEvent.type(field, VALID_EMAIL);
    await userEvent.click(canvas.getByRole('button', { name: 'Subscribe' }));

    await expect(await canvas.findByText(SUCCESS_MESSAGE)).toBeInTheDocument();
    await expect(field).toHaveValue('');
  },
};

export const Failure: Story = {
  beforeEach: () =>
    stubFetch(async () =>
      jsonResponse(
        {
          statusCode: 500,
          message: 'Internal Server Error',
          error: 'Internal Server Error',
        },
        500,
      ),
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox');

    await userEvent.type(field, VALID_EMAIL);
    await userEvent.click(canvas.getByRole('button', { name: 'Subscribe' }));

    await expect(await canvas.findByText(FAILURE_MESSAGE)).toBeInTheDocument();
  },
};
