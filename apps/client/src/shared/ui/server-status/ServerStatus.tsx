import * as stylex from '@stylexjs/stylex';
import { useQuery } from '@tanstack/react-query';
import { fetchCatalog } from '@/shared/api';
import { describeError } from '@/shared/lib/describeError';
import { animations } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';

const styles = stylex.create({
  root: {
    width: '100%',
    maxWidth: '28rem',
    borderRadius: '0.75rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.gray200,
    backgroundColor: '#fff',
    padding: '1.25rem',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  header: {
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  dot: {
    display: 'inline-block',
    height: '0.625rem',
    width: '0.625rem',
    borderRadius: '9999px',
  },
  pending: {
    backgroundColor: colors.warning,
    animationName: animations.pulse,
    animationDuration: '2s',
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
    animationIterationCount: 'infinite',
  },
  error: { backgroundColor: colors.danger },
  success: { backgroundColor: colors.success },
  title: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 600,
    color: colors.gray600,
  },
  message: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: colors.gray500,
  },
  messageError: { color: colors.danger },
  messageSuccess: { color: colors.gray600 },
  count: { fontWeight: 600, color: colors.ink },
});

export function ServerStatus() {
  const request = useQuery({ queryKey: ['catalog'], queryFn: fetchCatalog });

  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.header)}>
        <span {...stylex.props(styles.dot, styles[request.status])} />
        <h2 {...stylex.props(styles.title)}>Server connection</h2>
      </div>

      {request.status === 'pending' && (
        <p {...stylex.props(styles.message)}>Contacting the server…</p>
      )}

      {request.status === 'error' && (
        <p {...stylex.props(styles.message, styles.messageError)}>
          Could not reach the server: {describeError(request.error)}
        </p>
      )}

      {request.status === 'success' && (
        <p {...stylex.props(styles.message, styles.messageSuccess)}>
          Connected — server reports{' '}
          <span {...stylex.props(styles.count)}>{request.data.length}</span>{' '}
          product(s).
        </p>
      )}
    </div>
  );
}
