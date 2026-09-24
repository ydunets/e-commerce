import { isType } from '@e-commerce/contracts';
import * as stylex from '@stylexjs/stylex';
import { useActionState, useState } from 'react';
import { subscribeToNewsletter } from '@/shared/api';
import { media } from '@/shared/lib/breakpoints.stylex';
import { TextInput } from '@/shared/ui/text-input';
import { ToastProvider, useToast } from '../lib/toast-context';
import { validateEmail } from '../lib/validate-email';
import { SubscribeButton } from './SubscribeButton';
import { ToastViewport } from './ToastViewport';

const FAILURE_MESSAGE =
  'Failed to subscribe. Please ensure your email is correct or try again later.';
const EMPTY = '';
const NO_ERROR: string | undefined = undefined;

const styles = stylex.create({
  root: { width: '100%' },
  form: {
    display: 'flex',
    width: '100%',
    flexDirection: { default: 'column', [media.md]: 'row' },
    gap: '1rem',
    alignItems: { default: null, [media.md]: 'flex-start' },
  },
  field: { flexGrow: 1, flexShrink: 1, flexBasis: '0%' },
});

export const NewsletterForm = () => (
  <div {...stylex.props(styles.root)}>
    <ToastProvider>
      <NewsletterFormFields />
      <ToastViewport />
    </ToastProvider>
  </div>
);

const NewsletterFormFields = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState(EMPTY);

  const [errorMessage, formAction] = useActionState(
    async (
      _previous: string | undefined,
      formData: FormData,
    ): Promise<string | undefined> => {
      const field = formData.get('email');
      const value = isType(field, 'string') ? field : EMPTY;

      const validationError = validateEmail(value);
      if (validationError) {
        return validationError;
      }

      try {
        const response = await subscribeToNewsletter(value);
        setEmail((current) => (current === value ? EMPTY : current));
        showToast('success', response.message);
      } catch {
        showToast('error', FAILURE_MESSAGE);
      }

      return NO_ERROR;
    },
    NO_ERROR,
  );

  return (
    <form {...stylex.props(styles.form)} action={formAction} noValidate>
      <TextInput
        style={styles.field}
        label="Email address"
        labelHidden
        type="email"
        name="email"
        placeholder="Enter your email"
        value={email}
        onChange={setEmail}
        errorMessage={errorMessage}
      />
      <SubscribeButton />
    </form>
  );
};
