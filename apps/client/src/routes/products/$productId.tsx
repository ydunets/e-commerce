import { Await, createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { getProduct } from '@/entities/product';
import { getSpecifications } from '@/entities/specification';
import { API_BASE } from '@/shared/api';
import {
  ProductDetailsSection,
  ProductError,
  ProductPending,
} from '@/widgets/product-details';
import { ProductSpecificationsSection } from '@/widgets/product-specifications';

export const Route = createFileRoute('/products/$productId')({
  loader: async ({ params }) => {
    const specifications = getSpecifications(API_BASE).catch(() => null);
    const product = await getProduct(params.productId, API_BASE);
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
  wrapInSuspense: true,
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
      <Suspense fallback={null}>
        <Await promise={specifications}>
          {(data) =>
            data && data.length > 0 ? (
              <div className="mx-auto max-w-[1440px] px-4">
                <ProductSpecificationsSection specifications={data} />
              </div>
            ) : null
          }
        </Await>
      </Suspense>
    </main>
  );
}
