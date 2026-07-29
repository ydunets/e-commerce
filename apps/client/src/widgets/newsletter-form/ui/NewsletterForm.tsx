import { type FormEvent, useEffect, useState } from 'react';
import { subscribeToNewsletter } from '@/shared/api';
import { cx } from '@/shared/lib/cx';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/text-input';
import { validateEmail } from '../lib/validate-email';
import styles from './NewsletterForm.module.css';

const FAILURE_MESSAGE =
  'Failed to subscribe. Please ensure your email is correct or try again later.';
const TOAST_DURATION_MS = 10000;
const EMPTY = '';

type TToastVariant = 'success' | 'error';
type TToast = { variant: TToastVariant; message: string };

export const NewsletterForm = () => {
  const [email, setEmail] = useState(EMPTY);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<TToast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(undefined);
    setSubmitting(true);

    try {
      const response = await subscribeToNewsletter(email);
      setToast({ variant: 'success', message: response.message });
      setEmail(EMPTY);
    } catch {
      setToast({ variant: 'error', message: FAILURE_MESSAGE });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.root}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextInput
          className={styles.field}
          label="Email address"
          labelHidden
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={setEmail}
          errorMessage={errorMessage}
        />
        <Button type="submit" disabled={submitting}>
          Subscribe
        </Button>
      </form>

      {toast ? (
        <div className={styles.toast} role="status" aria-live="polite">
          <span
            className={cx(
              styles.toastMessage,
              toast.variant === 'success'
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
