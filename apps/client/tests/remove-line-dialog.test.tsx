import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { discountedCartLineFixture } from '../src/entities/cart/model/cart.fixture';
import {
  RemoveLineDialog,
  type TRemoveLineDialogProps,
} from '../src/widgets/cart-lines/ui/RemoveLineDialog';

const CONFIRM_DIALOG = { name: 'Confirm item removal' } as const;
const YES = { name: 'Yes' } as const;
const CANCEL = { name: 'Cancel' } as const;

const NOOP = () => {};

function renderDialog(overrides: Partial<TRemoveLineDialogProps>) {
  const props: TRemoveLineDialogProps = {
    line: discountedCartLineFixture,
    removing: false,
    removeFailed: false,
    onCancel: NOOP,
    onConfirm: NOOP,
    ...overrides,
  };
  return render(<RemoveLineDialog {...props} />);
}

test('stays closed without a removal candidate', () => {
  renderDialog({ line: null });

  expect(screen.queryByRole('dialog', CONFIRM_DIALOG)).not.toBeInTheDocument();
});

test('names the line and routes the two actions', async () => {
  const user = userEvent.setup();
  let cancelled = 0;
  let confirmed = 0;
  renderDialog({
    onCancel: () => {
      cancelled += 1;
    },
    onConfirm: () => {
      confirmed += 1;
    },
  });

  expect(screen.getByRole('dialog', CONFIRM_DIALOG)).toBeInTheDocument();
  expect(
    screen.getByText(new RegExp(discountedCartLineFixture.name)),
  ).toBeInTheDocument();

  await user.click(screen.getByRole('button', CANCEL));
  expect(cancelled).toBe(1);
  expect(confirmed).toBe(0);

  await user.click(screen.getByRole('button', YES));
  expect(confirmed).toBe(1);
});

test('disables Yes while removing and reports a failed removal', () => {
  renderDialog({ removing: true, removeFailed: true });

  expect(screen.getByRole('button', YES)).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent(
    "Couldn't remove the item.",
  );
});
