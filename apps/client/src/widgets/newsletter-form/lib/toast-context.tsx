import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react';
import { useTimer } from '@/shared/lib/useTimer';

const TOAST_DURATION_MS = 10000;

export type TToastVariant = 'success' | 'error';
type TToast = { variant: TToastVariant; message: string };

type TToastContextValue = {
  toast: TToast | null;
  showToast: (variant: TToastVariant, message: string) => void;
};

// Scoped to this widget's own subtree: NewsletterForm mounts the provider
// itself, nothing outside the widget can reach it. Not a step toward an
// app-wide toast provider, which stays out of scope until a second consumer
// exists.
const ToastContext = createContext<TToastContextValue | null>(null);

type TToastProviderProps = PropsWithChildren;

export const ToastProvider = ({ children }: TToastProviderProps) => {
  const [toast, setToast] = useState<TToast | null>(null);

  useTimer(() => setToast(null), toast ? TOAST_DURATION_MS : null, toast);

  const showToast = (variant: TToastVariant, message: string) => {
    setToast({ variant, message });
  };

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export function useToast(): TToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
