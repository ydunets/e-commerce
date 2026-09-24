import * as stylex from '@stylexjs/stylex';
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

const styles = stylex.create({
  main: { marginInline: 'auto', maxWidth: '1280px' },
});

function ProductsPage() {
  const { products } = Route.useLoaderData();

  return (
    <main {...stylex.props(styles.main)}>
      <ProductGridSection title="Products" products={products} />
    </main>
  );
}
