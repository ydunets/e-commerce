import * as stylex from '@stylexjs/stylex';
import { colors, shadows } from '@/shared/ui/tokens.stylex';
import { useToast } from '../lib/toast-context';

const styles = stylex.create({
  toast: {
    position: 'fixed',
    insetInline: 0,
    top: '1.5rem',
    zIndex: 50,
    display: 'flex',
    justifyContent: 'center',
    paddingInline: '1rem',
  },
  toastMessage: {
    borderRadius: '9999px',
    paddingInline: '1rem',
    paddingBlock: '0.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 500,
    boxShadow: shadows.card,
  },
  toastSuccess: { backgroundColor: colors.successSoft, color: colors.success },
  toastError: { backgroundColor: colors.dangerSoft, color: colors.danger },
});

export const ToastViewport = () => {
  const { toast } = useToast();

  if (!toast) return null;

  return (
    <div {...stylex.props(styles.toast)} role="status" aria-live="polite">
      <span
        {...stylex.props(
          styles.toastMessage,
          toast.variant === 'success' ? styles.toastSuccess : styles.toastError,
        )}
      >
        {toast.message}
      </span>
    </div>
  );
};
