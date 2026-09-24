import * as stylex from '@stylexjs/stylex';
import {
  type MouseEvent,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from 'react';
import { media } from '@/shared/lib/breakpoints.stylex';
import { focusRing } from '@/shared/ui/focus-ring';
import { colors, shadows } from '@/shared/ui/tokens.stylex';

export type TDialogSize = 'lg' | 'sm';

export type TDialogProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  label: string;
  size?: TDialogSize;
}>;

const styles = stylex.create({
  dialog: {
    position: 'fixed',
    inset: 0,
    margin: 'auto',
    width: 'min(92vw, 63rem)',
    maxHeight: 'min(88vh, 800px)',
    display: 'none',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 0,
    borderWidth: 0,
    borderRadius: '0.5rem',
    backgroundColor: '#fff',
    color: colors.ink,
    boxShadow: shadows.cardLg,
    '::backdrop': { backgroundColor: 'rgba(10, 10, 10, 0.7)' },
  },
  open: { display: 'flex' },
  sm: { width: 'min(92vw, 22rem)' },
  close: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    zIndex: 10,
    display: 'inline-flex',
    padding: '0.5rem',
    borderWidth: 0,
    borderRadius: '0.375rem',
    backgroundColor: {
      default: 'transparent',
      ':hover': { default: null, [media.hover]: colors.surface },
    },
    color: {
      default: colors.muted,
      ':hover': { default: null, [media.hover]: colors.ink },
    },
    cursor: 'pointer',
    transition: 'color 0.15s, background-color 0.15s',
  },
});

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Dialog = ({
  open,
  onClose,
  label,
  size = 'lg',
  children,
}: TDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState(false);

  const handleNativeClose = () => {
    if (open) onClose();
  };

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === ref.current) onClose();
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
    setShown(open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, [open]);

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- backdrop dismissal is mouse-only; Esc requests controlled dismissal through the native cancel event.
    <dialog
      ref={ref}
      {...stylex.props(
        styles.dialog,
        open && styles.open,
        size === 'sm' && styles.sm,
      )}
      aria-label={label}
      onClose={handleNativeClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleClick}
    >
      <button
        type="button"
        {...stylex.props(styles.close, focusRing.ring)}
        aria-label="Close dialog"
        onClick={onClose}
      >
        <CloseIcon />
      </button>
      {shown && children}
    </dialog>
  );
};
