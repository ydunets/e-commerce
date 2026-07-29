import { useActionState, useState } from 'react';
import { subscribeToNewsletter } from '@/shared/api';
import { TextInput } from '@/shared/ui/text-input';
import { ToastProvider, useToast } from '../lib/toast-context';
import { validateEmail } from '../lib/validate-email';
import styles from './NewsletterForm.module.css';
import { SubscribeButton } from './SubscribeButton';
import { ToastViewport } from './ToastViewport';

const FAILURE_MESSAGE =
  'Failed to subscribe. Please ensure your email is correct or try again later.';
const EMPTY = '';

type TFieldState = { kind: 'idle' } | { kind: 'invalid'; message: string };

const IDLE: TFieldState = { kind: 'idle' };

export const NewsletterForm = () => (
  <div className={styles.root}>
    <ToastProvider>
      <NewsletterFormFields />
      <ToastViewport />
    </ToastProvider>
  </div>
);

const NewsletterFormFields = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState(EMPTY);

  const [fieldState, formAction] = useActionState(
    async (
      _previous: TFieldState,
      formData: FormData,
    ): Promise<TFieldState> => {
      const value = String(formData.get('email') ?? '');

      const validationError = validateEmail(value);
      if (validationError) {
        return { kind: 'invalid', message: validationError };
      }

      try {
        const response = await subscribeToNewsletter(value);
        setEmail(EMPTY);
        showToast('success', response.message);
      } catch {
        showToast('error', FAILURE_MESSAGE);
      }

      return IDLE;
    },
    IDLE,
  );

  return (
    <form className={styles.form} action={formAction} noValidate>
      <TextInput
        className={styles.field}
        label="Email address"
        labelHidden
        type="email"
        name="email"
        placeholder="Enter your email"
        value={email}
        onChange={setEmail}
        errorMessage={
          fieldState.kind === 'invalid' ? fieldState.message : undefined
        }
      />
      <SubscribeButton />
    </form>
  );
};
