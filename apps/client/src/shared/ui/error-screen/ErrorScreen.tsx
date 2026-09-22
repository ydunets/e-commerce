import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import { colors } from '@/shared/ui/tokens.stylex';

// Centers a screen in the viewport. Shared so the error boundary and the
// not-found page sit in the same place on the page.
const layout = stylex.create({
  root: {
    display: 'flex',
    minHeight: '50vh',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: '1rem',
    paddingBlock: '4rem',
  },
});

export const ERROR_SCREEN_LAYOUT = layout.root;

export type TErrorScreenProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  footnote?: string;
};

const styles = stylex.create({
  root: {
    display: 'flex',
    maxWidth: '36rem',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.5rem',
    lineHeight: '2rem',
    fontWeight: 600,
    color: colors.ink,
  },
  description: { fontSize: '1rem', lineHeight: '1.5rem', color: colors.muted },
  footnote: {
    fontSize: '0.75rem',
    lineHeight: '1rem',
    color: colors.tertiary,
  },
});

export const ErrorScreen = ({
  title,
  description,
  action,
  footnote,
}: TErrorScreenProps) => (
  <div {...stylex.props(styles.root)}>
    <h1 {...stylex.props(styles.title)}>{title}</h1>
    {description ? (
      <div {...stylex.props(styles.description)}>{description}</div>
    ) : null}
    {action}
    {footnote ? <p {...stylex.props(styles.footnote)}>{footnote}</p> : null}
  </div>
);
