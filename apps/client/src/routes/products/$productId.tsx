import { createFileRoute } from '@tanstack/react-router';
import { getProduct } from '@/entities/product';
import {
  ProductDetailsSection,
  ProductError,
  ProductPending,
} from '@/widgets/product-details';

// During SSR the loader must hit the API directly; in the browser the
// relative path goes through the express /api proxy.
const API_BASE =
  typeof window === 'undefined'
    ? (process.env.API_URL ?? 'http://localhost:4000')
    : '';

export const Route = createFileRoute('/products/$productId')({
  loader: ({ params }) => getProduct(params.productId, API_BASE),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — StyleNest` : 'StyleNest' },
    ],
  }),
  pendingComponent: ProductPending,
  errorComponent: ({ error }) => (
    <ProductError
      message={error instanceof Error ? error.message : 'Unknown error'}
    />
  ),
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-8">
      <ProductDetailsSection product={product} />
    </main>
  );
}
