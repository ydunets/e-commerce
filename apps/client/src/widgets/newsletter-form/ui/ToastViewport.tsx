import { cx } from '@/shared/lib/cx';
import { useToast } from '../lib/toast-context';
import styles from './ToastViewport.module.css';

export const ToastViewport = () => {
  const { toast } = useToast();

  if (!toast) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span
        className={cx(
          styles.toastMessage,
          toast.variant === 'success' ? styles.toastSuccess : styles.toastError,
        )}
      >
        {toast.message}
      </span>
    </div>
  );
};
