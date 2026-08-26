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

/**
 * The storefront compositions (Figma 5-6578 Desktop, 5-6592 Tablet, 5-6606
 * Mobile) inset one content column by 16px on every breakpoint and stack the
 * sections flush inside it, so the vertical rhythm comes from each section's
 * own padding rather than from gaps at page level.
 */
const CONTENT_COLUMN = 'mx-auto max-w-[1440px] px-4';

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
    <main className={CONTENT_COLUMN}>
      <ProductDetailsSection product={product} />
      <Suspense fallback={null}>
        <Await promise={specifications}>
          {(data) =>
            data && data.length > 0 ? (
              <ProductSpecificationsSection specifications={data} />
            ) : null
          }
        </Await>
      </Suspense>
      <Suspense fallback={null}>
        <Await promise={collectionProducts}>
          {(data) =>
            data && data.length > 0 ? (
              <ProductGridSection
                title={COLLECTION_SECTION_TITLE}
                products={data}
              />
            ) : null
          }
        </Await>
      </Suspense>
    </main>
  );
}
