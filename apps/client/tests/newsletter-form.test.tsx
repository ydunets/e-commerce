import { beforeEach, expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewsletterForm } from '@/widgets/newsletter-form';

const MALFORMED_EMAIL = 'jane@example';
const REQUIRED_MESSAGE = 'Email address is required.';
const FORMAT_MESSAGE = 'Please enter a valid email address.';
const SUBSCRIBE_BUTTON = { name: 'Subscribe' } as const;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

test('submitting an empty email shows the required message', async () => {
  const user = userEvent.setup();
  render(<NewsletterForm />);

  await user.click(screen.getByRole('button', SUBSCRIBE_BUTTON));

  expect(screen.getByText(REQUIRED_MESSAGE)).toBeInTheDocument();
});

test('submitting a malformed email shows the format message', async () => {
  const user = userEvent.setup();
  render(<NewsletterForm />);

  await user.type(screen.getByRole('textbox'), MALFORMED_EMAIL);
  await user.click(screen.getByRole('button', SUBSCRIBE_BUTTON));

  expect(screen.getByText(FORMAT_MESSAGE)).toBeInTheDocument();
});
