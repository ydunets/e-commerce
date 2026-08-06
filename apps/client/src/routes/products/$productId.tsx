import { Await, createFileRoute, notFound } from '@tanstack/react-router';
import { Suspense } from 'react';
import { findProduct, getProducts } from '@/entities/product';
import { getSpecifications } from '@/entities/specification';
import { API_BASE } from '@/shared/api';
import {
  ProductDetailsSection,
  ProductPending,
} from '@/widgets/product-details';
import { ProductGridSection } from '@/widgets/product-grid';
import { ProductSpecificationsSection } from '@/widgets/product-specifications';

const COLLECTION_SECTION_TITLE = 'In this collection';
const COLLECTION_PRODUCT_COUNT = 4;

export const Route = createFileRoute('/products/$productId')({
  loader: async ({ params }) => {
    const specifications = getSpecifications(API_BASE).catch(() => null);
    const product = await findProduct(params.productId, API_BASE);
    if (!product) {
      throw notFound();
    }

    const collectionProducts = getProducts(API_BASE, {
      collection: product.collection,
      exclude: product.id,
      limit: COLLECTION_PRODUCT_COUNT,
    }).catch(() => null);

    return { product, specifications, collectionProducts };
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
  component: ProductPage,
});

function ProductPage() {
  const { product, specifications, collectionProducts } = Route.useLoaderData();

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
      <Suspense fallback={null}>
        <Await promise={collectionProducts}>
          {(data) =>
            data && data.length > 0 ? (
              <div className="mx-auto max-w-[1440px] px-4">
                <ProductGridSection
                  title={COLLECTION_SECTION_TITLE}
                  products={data}
                />
              </div>
            ) : null
          }
        </Await>
      </Suspense>
    </main>
  );
}
