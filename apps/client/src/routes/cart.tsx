import type { CartResponseDto } from '@e-commerce/contracts';
import * as stylex from '@stylexjs/stylex';
import { createFileRoute } from '@tanstack/react-router';
import { useCart } from '@/entities/cart';
import { media } from '@/shared/lib/breakpoints.stylex';
import { useHydrated } from '@/shared/lib/useHydrated';
import { colors } from '@/shared/ui/tokens.stylex';
import { CartEmptyState, CartLines } from '@/widgets/cart-lines';
import { OrderSummary } from '@/widgets/order-summary';

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [{ title: 'Shopping Cart — StyleNest' }],
  }),
  component: CartPage,
});

const styles = stylex.create({
  contentColumn: {
    marginInline: 'auto',
    maxWidth: '1440px',
    paddingInline: '1rem',
  },
  section: {
    paddingInline: {
      default: '0.75rem',
      [media.md]: '1rem',
      [media.lg]: '6rem',
    },
    paddingBlock: { default: '3rem', [media.md]: '4rem', [media.lg]: '6rem' },
  },
  title: {
    fontSize: { default: '1.875rem', [media.md]: '3rem' },
    lineHeight: { default: '2.25rem', [media.md]: 1 },
    fontWeight: 600,
    color: colors.ink,
  },
  content: { marginTop: '4rem' },
  error: { fontSize: '1rem', lineHeight: '1.5rem', color: colors.muted },
  grid: {
    display: 'grid',
    gap: '2rem',
    gridTemplateColumns: { default: null, [media.xl]: 'minmax(0, 1fr) 384px' },
  },
});

function CartPage() {
  const hydrated = useHydrated();
  const { data: cart, isPending, isError } = useCart();

  return (
    <main {...stylex.props(styles.contentColumn)}>
      <section aria-label="Shopping cart" {...stylex.props(styles.section)}>
        <h1 {...stylex.props(styles.title)}>Shopping Cart</h1>

        {hydrated && !isPending && (
          <div {...stylex.props(styles.content)}>
            <CartContent cart={cart} isError={isError} />
          </div>
        )}
      </section>
    </main>
  );
}

type TCartContentProps = {
  cart: CartResponseDto | null | undefined;
  isError: boolean;
};

function CartContent({ cart, isError }: TCartContentProps) {
  if (isError) {
    return (
      <p role="alert" {...stylex.props(styles.error)}>
        Couldn't load your cart. Please try again.
      </p>
    );
  }

  if (cart && cart.lines.length > 0) {
    return (
      <div {...stylex.props(styles.grid)}>
        <CartLines cart={cart} />
        <OrderSummary cart={cart} />
      </div>
    );
  }

  return <CartEmptyState />;
}
