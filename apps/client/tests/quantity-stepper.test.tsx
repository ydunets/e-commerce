import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  QuantityStepper,
  type TQuantityStepperProps,
} from '../src/shared/ui/quantity-stepper';

const DECREASE = { name: 'Decrease quantity' } as const;
const INCREASE = { name: 'Increase quantity' } as const;

const START_QUANTITY = 1;
const MAX_STOCK = 2;
const EMPTY = 0;

// The stepper is controlled, so a harness owns the value and feeds it back.
function ControlledStepper({ max }: Pick<TQuantityStepperProps, 'max'>) {
  const [value, setValue] = useState(START_QUANTITY);
  const props: TQuantityStepperProps = { value, max, onChange: setValue };
  return <QuantityStepper {...props} />;
}

test('increments up to the available stock and toggles the bounds', async () => {
  const user = userEvent.setup();
  render(<ControlledStepper max={MAX_STOCK} />);

  const decrease = screen.getByRole('button', DECREASE);
  const increase = screen.getByRole('button', INCREASE);

  // At the minimum, only decreasing is blocked.
  expect(decrease).toBeDisabled();
  expect(screen.getByText(String(START_QUANTITY))).toBeInTheDocument();

  await user.click(increase);

  // At the maximum, the bounds flip.
  expect(screen.getByText(String(MAX_STOCK))).toBeInTheDocument();
  expect(increase).toBeDisabled();
  expect(decrease).toBeEnabled();
});

test('disables both controls when out of stock', () => {
  const props: TQuantityStepperProps = {
    value: EMPTY,
    max: EMPTY,
    disabled: true,
    onChange: () => {},
  };
  render(<QuantityStepper {...props} />);

  expect(screen.getByRole('button', DECREASE)).toBeDisabled();
  expect(screen.getByRole('button', INCREASE)).toBeDisabled();
});
