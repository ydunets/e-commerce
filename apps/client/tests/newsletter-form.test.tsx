import { afterEach, beforeEach, expect, rstest, test } from '@rstest/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewsletterForm } from '@/widgets/newsletter-form';

const VALID_EMAIL = 'jane@example.com';
const MALFORMED_EMAIL = 'jane@example';
const REQUIRED_MESSAGE = 'Email address is required.';
const FORMAT_MESSAGE = 'Please enter a valid email address.';
const SUCCESS_MESSAGE =
  'Subscription successful! Please check your email to confirm.';
const FAILURE_MESSAGE =
  'Failed to subscribe. Please ensure your email is correct or try again later.';
const SUBSCRIBE_BUTTON = { name: 'Subscribe' } as const;
const EMPTY = '';

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  global.fetch = originalFetch;
});

test('submitting an empty email shows the required message and does not call the API', async () => {
  const fetchSpy = rstest.fn();
  global.fetch = fetchSpy as typeof global.fetch;
  const user = userEvent.setup();
  render(<NewsletterForm />);

  await user.click(screen.getByRole('button', SUBSCRIBE_BUTTON));

  expect(screen.getByText(REQUIRED_MESSAGE)).toBeInTheDocument();
  expect(fetchSpy).not.toHaveBeenCalled();
});

test('submitting a malformed email shows the format message and does not call the API', async () => {
  const fetchSpy = rstest.fn();
  global.fetch = fetchSpy as typeof global.fetch;
  const user = userEvent.setup();
  render(<NewsletterForm />);

  await user.type(screen.getByRole('textbox'), MALFORMED_EMAIL);
  await user.click(screen.getByRole('button', SUBSCRIBE_BUTTON));

  expect(screen.getByText(FORMAT_MESSAGE)).toBeInTheDocument();
  expect(fetchSpy).not.toHaveBeenCalled();
});

test('submitting a valid email calls the API, shows a success toast, and clears the field', async () => {
  global.fetch = rstest.fn(async () =>
    jsonResponse({ message: SUCCESS_MESSAGE }, 200),
  ) as typeof global.fetch;
  const user = userEvent.setup();
  render(<NewsletterForm />);

  const field = screen.getByRole('textbox');
  await user.type(field, VALID_EMAIL);
  await user.click(screen.getByRole('button', SUBSCRIBE_BUTTON));

  expect(await screen.findByText(SUCCESS_MESSAGE)).toBeInTheDocument();
  expect(field).toHaveValue(EMPTY);
});

test('an API failure shows a failure toast', async () => {
  global.fetch = rstest.fn(async () =>
    jsonResponse(
      {
        statusCode: 500,
        message: 'Internal Server Error',
        error: 'Internal Server Error',
      },
      500,
    ),
  ) as typeof global.fetch;
  const user = userEvent.setup();
  render(<NewsletterForm />);

  await user.type(screen.getByRole('textbox'), VALID_EMAIL);
  await user.click(screen.getByRole('button', SUBSCRIBE_BUTTON));

  expect(await screen.findByText(FAILURE_MESSAGE)).toBeInTheDocument();
});

test('the Subscribe button is disabled while the submission is in flight', async () => {
  let resolveFetch: (response: Response) => void = () => {};
  global.fetch = rstest.fn(
    () =>
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
  ) as typeof global.fetch;
  const user = userEvent.setup();
  render(<NewsletterForm />);

  await user.type(screen.getByRole('textbox'), VALID_EMAIL);
  const button = screen.getByRole('button', SUBSCRIBE_BUTTON);
  await user.click(button);

  expect(button).toBeDisabled();

  resolveFetch(jsonResponse({ message: SUCCESS_MESSAGE }, 200));
  await waitFor(() => expect(button).not.toBeDisabled());
});

test('the field can be submitted with the keyboard', async () => {
  global.fetch = rstest.fn(async () =>
    jsonResponse({ message: SUCCESS_MESSAGE }, 200),
  ) as typeof global.fetch;
  const user = userEvent.setup();
  render(<NewsletterForm />);

  await user.type(screen.getByRole('textbox'), `${VALID_EMAIL}{Enter}`);

  expect(await screen.findByText(SUCCESS_MESSAGE)).toBeInTheDocument();
});
