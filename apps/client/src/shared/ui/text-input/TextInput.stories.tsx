import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TextInput, type TTextInputProps } from './TextInput';

const LABEL = 'Email address';
const PLACEHOLDER = 'Enter your email';
const FILLED_EMAIL = 'johnappleseed.com';
const ERROR_MESSAGE = 'Please enter a valid email address.';
const EMPTY = '';

const noop = () => {};

function ControlledField(props: TTextInputProps) {
  const [value, setValue] = useState(props.value);
  return <TextInput {...props} value={value} onChange={setValue} />;
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
    onChange: noop,
  },
  argTypes: {
    type: { control: 'select', options: ['text', 'email'] },
  },
  render: (args) => <ControlledField {...args} />,
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Focus: Story = {
  render: (args) => <FocusedField {...args} />,
};

export const Filled: Story = {
  args: { value: FILLED_EMAIL },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const ErrorEmpty: Story = {
  args: { errorMessage: ERROR_MESSAGE },
};

export const ErrorFilled: Story = {
  args: { value: FILLED_EMAIL, errorMessage: ERROR_MESSAGE },
};

export const ErrorFocused: Story = {
  args: { errorMessage: ERROR_MESSAGE },
  render: (args) => <FocusedField {...args} />,
};

export const HiddenLabel: Story = {
  args: { labelHidden: true },
};
