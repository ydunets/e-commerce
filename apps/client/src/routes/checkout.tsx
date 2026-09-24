import * as stylex from '@stylexjs/stylex';
import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useCart, useCartState } from '@/entities/cart';
import { media } from '@/shared/lib/breakpoints.stylex';
import { useHydrated } from '@/shared/lib/useHydrated';
import { colors } from '@/shared/ui/tokens.stylex';
import { CartLines } from '@/widgets/cart-lines';
import { OrderSummary } from '@/widgets/order-summary';

export const Route = createFileRoute('/checkout')({
  head: () => ({ meta: [{ title: 'Checkout | StyleNest' }] }),
  component: CheckoutPage,
});

const styles = stylex.create({
  root: {
    maxWidth: '1440px',
    marginInline: 'auto',
    paddingInline: {
      default: '1.75rem',
      [media.md]: '2rem',
      [media.lg]: '7rem',
    },
    paddingBlock: { default: '3rem', [media.md]: '4rem', [media.lg]: '6rem' },
  },
  title: {
    fontSize: { default: '1.875rem', [media.md]: '3rem' },
    lineHeight: { default: '2.25rem', [media.md]: 1 },
    fontWeight: 600,
    color: colors.ink,
  },
  grid: {
    marginTop: '4rem',
    display: 'grid',
    alignItems: 'start',
    gap: '2rem',
    gridTemplateColumns: { default: null, [media.xl]: 'minmax(0, 1fr) 384px' },
  },
});

function CheckoutPage() {
  const hydrated = useHydrated();
  const { data: cart } = useCart();
  const { checkoutCartId } = useCartState();

  // Authorization lasts only until the next cart write. Reloads and direct
  // visits return to the cart so every checkout handoff has a clean validation.
  if (
    hydrated &&
    (!cart || cart.id !== checkoutCartId || cart.lines.length === 0)
  ) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <main {...stylex.props(styles.root)}>
      <h1 {...stylex.props(styles.title)}>Checkout</h1>
      {hydrated && cart && (
        <div {...stylex.props(styles.grid)}>
          <CartLines cart={cart} readOnly />
          <OrderSummary cart={cart} readOnly />
        </div>
      )}
    </main>
  );
}
