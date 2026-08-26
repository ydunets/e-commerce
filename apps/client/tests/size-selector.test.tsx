import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  SizeSelector,
  type TSizeOption,
  type TSizeSelectorProps,
} from '../src/shared/ui/size-selector';

const IN_TAB_SEQUENCE = '0';
const OUT_OF_TAB_SEQUENCE = '-1';

const SIZES: TSizeOption[] = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
];

// The middle size is sold out, so arrow keys have something to hop over.
const SIZES_WITH_GAP: TSizeOption[] = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'S', disabled: true },
  { value: 'md', label: 'M' },
];

const SOLD_OUT_SIZES: TSizeOption[] = [
  { value: 'xs', label: 'XS', disabled: true },
  { value: 'sm', label: 'S', disabled: true },
];

// The selector is controlled, so a harness owns the value and feeds it back.
function ControlledSelector({
  options,
  initialValue,
}: {
  options: TSizeOption[];
  initialValue: string | null;
}) {
  const [value, setValue] = useState(initialValue);
  const props: TSizeSelectorProps = { options, value, onChange: setValue };
  return <SizeSelector {...props} />;
}

const size = (label: string) => screen.getByRole('radio', { name: label });

const checkedSize = () => screen.getByRole('radio', { checked: true });

test('keeps only the checked size in the tab sequence', () => {
  render(<ControlledSelector options={SIZES} initialValue="sm" />);

  expect(size('S')).toHaveAttribute('tabindex', IN_TAB_SEQUENCE);
  for (const label of ['XS', 'M', 'L']) {
    expect(size(label)).toHaveAttribute('tabindex', OUT_OF_TAB_SEQUENCE);
  }
});

test('moves the selection with the arrow keys and wraps at both ends', async () => {
  const user = userEvent.setup();
  render(<ControlledSelector options={SIZES} initialValue="xs" />);

  size('XS').focus();
  await user.keyboard('{ArrowRight}');

  expect(checkedSize()).toHaveAccessibleName('S');
  expect(size('S')).toHaveFocus();

  await user.keyboard('{ArrowLeft}{ArrowLeft}');

  expect(checkedSize()).toHaveAccessibleName('L');
  expect(size('L')).toHaveFocus();

  await user.keyboard('{ArrowDown}');

  expect(checkedSize()).toHaveAccessibleName('XS');
});

test('jumps to the first size on Home and the last on End', async () => {
  const user = userEvent.setup();
  render(<ControlledSelector options={SIZES} initialValue="sm" />);

  size('S').focus();
  await user.keyboard('{End}');

  expect(checkedSize()).toHaveAccessibleName('L');

  await user.keyboard('{Home}');

  expect(checkedSize()).toHaveAccessibleName('XS');
});

test('skips a sold-out size instead of selecting or focusing it', async () => {
  const user = userEvent.setup();
  render(<ControlledSelector options={SIZES_WITH_GAP} initialValue="xs" />);

  size('XS').focus();
  await user.keyboard('{ArrowRight}');

  expect(checkedSize()).toHaveAccessibleName('M');
  expect(size('S')).not.toHaveFocus();
  expect(size('S')).toHaveAttribute('aria-checked', 'false');
});

test('offers a tab stop when the checked size is sold out', () => {
  render(<ControlledSelector options={SIZES_WITH_GAP} initialValue="sm" />);

  expect(size('XS')).toHaveAttribute('tabindex', IN_TAB_SEQUENCE);
  expect(size('S')).toHaveAttribute('tabindex', OUT_OF_TAB_SEQUENCE);
});

test('offers a tab stop when no size is selected yet', () => {
  render(<ControlledSelector options={SIZES} initialValue={null} />);

  expect(size('XS')).toHaveAttribute('tabindex', IN_TAB_SEQUENCE);
});

test('leaves an entirely sold-out group out of the tab sequence', () => {
  render(<ControlledSelector options={SOLD_OUT_SIZES} initialValue="xs" />);

  for (const label of ['XS', 'S']) {
    expect(size(label)).toHaveAttribute('tabindex', OUT_OF_TAB_SEQUENCE);
  }
});
