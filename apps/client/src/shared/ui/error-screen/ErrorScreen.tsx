import type { ReactNode } from 'react';

// Centers a screen in the viewport. Shared so the error boundary and the
// not-found page sit in the same place on the page.
export const ERROR_SCREEN_LAYOUT =
  'flex min-h-[50vh] items-center justify-center px-4 py-16';

export type TErrorScreenProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  footnote?: string;
};

export const ErrorScreen = ({
  title,
  description,
  action,
  footnote,
}: TErrorScreenProps) => (
  <div className="flex max-w-xl flex-col items-center gap-4 text-center">
    <h1 className="text-2xl font-semibold text-ink">{title}</h1>
    {description ? (
      <div className="text-base text-muted">{description}</div>
    ) : null}
    {action}
    {footnote ? <p className="text-xs text-tertiary">{footnote}</p> : null}
  </div>
);
