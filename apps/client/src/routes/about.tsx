import * as stylex from '@stylexjs/stylex';
import { createFileRoute } from '@tanstack/react-router';
import { media } from '@/shared/lib/breakpoints.stylex';
import { ServerStatus } from '@/shared/ui/server-status';
import { colors } from '@/shared/ui/tokens.stylex';

export const Route = createFileRoute('/about')({
  // Runs on the server during SSR; the result is dehydrated to the client.
  loader: () => ({ renderedAt: new Date().toISOString() }),
  component: About,
});

const styles = stylex.create({
  main: {
    marginInline: 'auto',
    display: 'flex',
    maxWidth: '1280px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1.5rem',
    paddingInline: { default: '1rem', [media.md]: '2rem' },
    paddingBlock: '2.5rem',
  },
  title: {
    fontSize: '1.875rem',
    lineHeight: '2.25rem',
    fontWeight: 700,
    color: colors.ink,
  },
  body: { color: colors.muted },
});

function About() {
  const { renderedAt } = Route.useLoaderData();

  return (
    <main {...stylex.props(styles.main)}>
      <h1 {...stylex.props(styles.title)}>About</h1>
      <p {...stylex.props(styles.body)}>
        This page was server-rendered at {renderedAt}.
      </p>
      <ServerStatus />
    </main>
  );
}
