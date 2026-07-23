import { createFileRoute } from '@tanstack/react-router';
import { getProducts } from '@/entities/product';
import { API_BASE } from '@/shared/api';
import { ProductGridSection } from '@/widgets/product-grid';

export const Route = createFileRoute('/products/')({
  loader: async () => ({
    products: await getProducts(API_BASE),
  }),
  head: () => ({
    meta: [{ title: 'Products — StyleNest' }],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { products } = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
      <ProductGridSection title="Products" products={products} />
    </main>
  );
}
