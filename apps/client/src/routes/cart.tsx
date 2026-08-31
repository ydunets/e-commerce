import type { CartResponseDto } from '@e-commerce/contracts';
import { createFileRoute } from '@tanstack/react-router';
import { useCart } from '@/entities/cart';
import { useHydrated } from '@/shared/lib/useHydrated';
import { CartEmptyState, CartLines } from '@/widgets/cart-lines';
import { OrderSummary } from '@/widgets/order-summary';

const CONTENT_COLUMN = 'mx-auto max-w-[1440px] px-4';

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [{ title: 'Shopping Cart — StyleNest' }],
  }),
  component: CartPage,
});

function CartPage() {
  const hydrated = useHydrated();
  const { data: cart, isPending, isError } = useCart();

  return (
    <main className={CONTENT_COLUMN}>
      <section
        aria-label="Shopping cart"
        className="px-3 py-12 md:px-4 md:py-16 lg:px-24 lg:py-24"
      >
        <h1 className="text-3xl font-semibold text-ink md:text-5xl">
          Shopping Cart
        </h1>

        {hydrated && !isPending && (
          <div className="mt-16">
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
      <p role="alert" className="text-base text-muted">
        Couldn't load your cart. Please try again.
      </p>
    );
  }

  if (cart && cart.lines.length > 0) {
    return (
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_384px]">
        <CartLines cart={cart} />
        <OrderSummary cart={cart} />
      </div>
    );
  }

  return <CartEmptyState />;
}
