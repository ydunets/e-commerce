import * as stylex from '@stylexjs/stylex';
import { createFileRoute } from '@tanstack/react-router';
import { media } from '@/shared/lib/breakpoints.stylex';
import { Button } from '@/shared/ui/button';
import { colors } from '@/shared/ui/tokens.stylex';

export const Route = createFileRoute('/')({
  component: Home,
});

const styles = stylex.create({
  hero: {
    marginInline: 'auto',
    display: 'flex',
    minHeight: '40vh',
    maxWidth: '1280px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: '1.5rem',
    paddingInline: { default: '1rem', [media.md]: '2rem' },
    paddingBlock: '4rem',
  },
  title: {
    fontSize: { default: '2.25rem', [media.md]: '3rem' },
    lineHeight: { default: '2.5rem', [media.md]: 1 },
    fontWeight: 700,
    color: colors.ink,
  },
  lead: {
    maxWidth: '36rem',
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    color: colors.muted,
  },
});

function Home() {
  return (
    <main>
      <section {...stylex.props(styles.hero)}>
        <h1 {...stylex.props(styles.title)}>
          Discover the StyleNest collection
        </h1>
        <p {...stylex.props(styles.lead)}>
          Timeless pieces, honest materials. Server-rendered with TanStack
          Router, styled with StyleX.
        </p>
        <Button href="/products" size="lg">
          Shop now
        </Button>
      </section>
    </main>
  );
}
