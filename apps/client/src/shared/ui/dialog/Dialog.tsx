import {
  type MouseEvent,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from 'react';
import styles from './Dialog.module.css';

export type TDialogProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  label: string;
}>;

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

export const Dialog = ({ open, onClose, label, children }: TDialogProps) => {
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

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismissal is mouse-only; Esc closes the dialog via the native close event.
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label={label}
      onClose={handleNativeClose}
      onClick={handleClick}
    >
      <button
        type="button"
        className={styles.close}
        aria-label="Close dialog"
        onClick={onClose}
      >
        <CloseIcon />
      </button>
      {shown && children}
    </dialog>
  );
};
