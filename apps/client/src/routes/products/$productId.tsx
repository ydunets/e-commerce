import { createFileRoute } from '@tanstack/react-router';
import { getProduct } from '@/entities/product';
import { getSpecifications } from '@/entities/specification';
import {
  ProductDetailsSection,
  ProductError,
  ProductPending,
} from '@/widgets/product-details';
import { ProductSpecificationsSection } from '@/widgets/product-specifications';

// During SSR the loader must hit the API directly; in the browser the
// relative path goes through the express /api proxy.
const API_BASE =
  typeof window === 'undefined'
    ? (process.env.API_URL ?? 'http://localhost:4000')
    : '';

export const Route = createFileRoute('/products/$productId')({
  loader: async ({ params }) => {
    // A specifications outage must not take down the product page.
    const [product, specifications] = await Promise.all([
      getProduct(params.productId, API_BASE),
      getSpecifications(API_BASE).catch(() => null),
    ]);
    return { product, specifications };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.product.name} — StyleNest`
          : 'StyleNest',
      },
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
  const { product, specifications } = Route.useLoaderData();

  return (
    <main>
      <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8">
        <ProductDetailsSection product={product} />
      </div>
      {specifications && specifications.length > 0 && (
        <div className="mx-auto max-w-[1440px] px-4">
          <ProductSpecificationsSection specifications={specifications} />
        </div>
      )}
    </main>
  );
}
