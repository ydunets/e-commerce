import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { TextInput, type TTextInputProps } from './TextInput';

const LABEL = 'Email address';
const PLACEHOLDER = 'Enter your email';
const VALID_EMAIL = 'john@appleseed.com';
const REJECTED_EMAIL = 'johnappleseed.com';
const ERROR_MESSAGE = 'Please enter a valid email address.';
const EMPTY = '';

function ControlledField(props: TTextInputProps) {
  const [value, setValue] = useState(props.value);
  return (
    <TextInput
      {...props}
      value={value}
      onChange={(next) => {
        props.onChange(next);
        setValue(next);
      }}
    />
  );
}

const focusField = (node: HTMLDivElement | null) => {
  node?.querySelector('input')?.focus();
};

function FocusedField(props: TTextInputProps) {
  return (
    <div ref={focusField}>
      <ControlledField {...props} />
    </div>
  );
}

const meta = {
  title: 'Shared/TextInput',
  component: TextInput,
  args: {
    label: LABEL,
    placeholder: PLACEHOLDER,
    type: 'email',
    value: EMPTY,
    onChange: fn(),
  },
  argTypes: {
    type: { control: 'select', options: ['text', 'email'] },
  },
  // The harness seeds its state from the arg, so remount when the arg changes.
  render: (args) => <ControlledField {...args} key={args.value} />,
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Focus: Story = {
  render: (args) => <FocusedField {...args} key={args.value} />,
};

export const Filled: Story = {
  args: { value: VALID_EMAIL },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const ErrorEmpty: Story = {
  args: { errorMessage: ERROR_MESSAGE },
};

export const ErrorFilled: Story = {
  args: { value: REJECTED_EMAIL, errorMessage: ERROR_MESSAGE },
};

export const ErrorFocused: Story = {
  args: { errorMessage: ERROR_MESSAGE },
  render: (args) => <FocusedField {...args} key={args.value} />,
};

export const HiddenLabel: Story = {
  args: { labelHidden: true },
};
