import { useActionState, useEffect, useState } from 'react';
import { subscribeToNewsletter } from '@/shared/api';
import { cx } from '@/shared/lib/cx';
import { TextInput } from '@/shared/ui/text-input';
import { validateEmail } from '../lib/validate-email';
import styles from './NewsletterForm.module.css';
import { SubscribeButton } from './SubscribeButton';

const FAILURE_MESSAGE =
  'Failed to subscribe. Please ensure your email is correct or try again later.';
const TOAST_DURATION_MS = 10000;
const EMPTY = '';

type TSubscribeState =
  | { kind: 'idle' }
  | { kind: 'invalid'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'failure'; message: string };

const INITIAL_STATE: TSubscribeState = { kind: 'idle' };

export const NewsletterForm = () => {
  const [email, setEmail] = useState(EMPTY);
  const [toastDismissed, setToastDismissed] = useState(false);

  const [state, formAction] = useActionState(
    async (
      _previous: TSubscribeState,
      formData: FormData,
    ): Promise<TSubscribeState> => {
      const value = String(formData.get('email') ?? '');

      const validationError = validateEmail(value);
      if (validationError) {
        return { kind: 'invalid', message: validationError };
      }

      try {
        const response = await subscribeToNewsletter(value);
        setEmail(EMPTY);
        return { kind: 'success', message: response.message };
      } catch {
        return { kind: 'failure', message: FAILURE_MESSAGE };
      }
    },
    INITIAL_STATE,
  );

  useEffect(() => {
    setToastDismissed(false);
    if (state.kind !== 'success' && state.kind !== 'failure') return;
    const timer = setTimeout(() => setToastDismissed(true), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const toast =
    !toastDismissed && (state.kind === 'success' || state.kind === 'failure')
      ? state
      : null;

  return (
    <div className={styles.root}>
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
          errorMessage={state.kind === 'invalid' ? state.message : undefined}
        />
        <SubscribeButton />
      </form>

      {toast ? (
        <div className={styles.toast} role="status" aria-live="polite">
          <span
            className={cx(
              styles.toastMessage,
              toast.kind === 'success'
                ? styles.toastSuccess
                : styles.toastError,
            )}
          >
            {toast.message}
          </span>
        </div>
      ) : null}
    </div>
  );
};
