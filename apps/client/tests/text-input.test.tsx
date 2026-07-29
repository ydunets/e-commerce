import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { TextInput, type TTextInputProps } from '../src/shared/ui/text-input';

const LABEL = 'Email address';
const FIELD = { name: LABEL } as const;
const PLACEHOLDER = 'Enter your email';
const ERROR_MESSAGE = 'Please enter a valid email address.';
const TYPED_EMAIL = 'john@appleseed.com';
const EMPTY = '';

type TFieldProps = Omit<TTextInputProps, 'value' | 'onChange'>;

// The input is controlled, so a harness owns the value and feeds it back.
function ControlledField(fieldProps: TFieldProps) {
  const [value, setValue] = useState(EMPTY);
  const props: TTextInputProps = { ...fieldProps, value, onChange: setValue };
  return <TextInput {...props} />;
}

test('associates the label with the field and reports what the visitor types', async () => {
  const user = userEvent.setup();
  render(<ControlledField label={LABEL} placeholder={PLACEHOLDER} />);

  const field = screen.getByRole('textbox', FIELD);
  await user.type(field, TYPED_EMAIL);

  expect(field).toHaveValue(TYPED_EMAIL);
});

test('keeps the label reachable when it is only visible to assistive tech', () => {
  render(
    <ControlledField label={LABEL} placeholder={PLACEHOLDER} labelHidden />,
  );

  expect(screen.getByRole('textbox', FIELD)).toBeInTheDocument();
});

test('marks the field invalid and describes it with the error message', () => {
  render(<ControlledField label={LABEL} errorMessage={ERROR_MESSAGE} />);

  const field = screen.getByRole('textbox', FIELD);

  expect(field).toBeInvalid();
  expect(field).toHaveAccessibleDescription(ERROR_MESSAGE);
});

test('leaves the field valid and undescribed without an error', () => {
  render(<ControlledField label={LABEL} />);

  const field = screen.getByRole('textbox', FIELD);

  expect(field).toBeValid();
  expect(field).toHaveAccessibleDescription(EMPTY);
});

test('ignores typing while disabled', async () => {
  const user = userEvent.setup();
  render(<ControlledField label={LABEL} disabled />);

  const field = screen.getByRole('textbox', FIELD);
  await user.type(field, TYPED_EMAIL);

  expect(field).toBeDisabled();
  expect(field).toHaveValue(EMPTY);
});
