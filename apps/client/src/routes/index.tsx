import { createFileRoute } from '@tanstack/react-router';
import { getProducts } from '@/entities/product';
import { API_BASE } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { ProductGridSection } from '@/widgets/product-grid';

const LATEST_ARRIVALS_COUNT = 8;

export const Route = createFileRoute('/')({
  loader: async () => ({
    products: await getProducts(API_BASE, {
      limit: LATEST_ARRIVALS_COUNT,
    }).catch(() => null),
  }),
  component: Home,
});

function Home() {
  const { products } = Route.useLoaderData();

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-16 px-4 py-16 md:px-8">
      <section className="flex min-h-[40vh] flex-col items-start justify-center gap-6">
        <h1 className="text-4xl font-bold text-ink md:text-5xl">
          Discover the StyleNest collection
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Timeless pieces, honest materials. Server-rendered with TanStack
          Router, styled with Tailwind.
        </p>
        <Button href="/products" size="lg">
          Shop now
        </Button>
      </section>
      {products && products.length > 0 && (
        <ProductGridSection
          title="Latest Arrivals"
          products={products}
          action={
            <Button href="/products" variant="secondary">
              View all
            </Button>
          }
        />
      )}
    </main>
  );
}
