import type { ProductRepository } from '#src/modules/product/database/product.repository.port.ts';
import type { ProductEntity, ProductVariant } from '#src/modules/product/domain/product.types.ts';

interface ProductRow {
  product_id: string;
  name: string;
  description: string;
}

interface InventoryRow {
  sku: string;
  color: string;
  size: string | null;
  list_price: string;
  discount_percentage: number | null;
  sale_price: string;
  stock: number;
  sold: number;
}

interface ImageRow {
  color: string;
  image_url: string;
}

interface InfoRow {
  title: string;
  description: string[];
}

interface ReviewSummaryRow {
  count: number;
  average: number;
}

const SIZE_RANK: Record<string, number> = { xs: 0, sm: 1, md: 2, lg: 3, xl: 4, xxl: 5 };

function sizeRank(size: string): number {
  const known = SIZE_RANK[size];
  if (known !== undefined) return known;
  const numeric = Number(size);
  return Number.isNaN(numeric) ? 900 : 100 + numeric;
}

// Distinct colours ordered by where their first image appears (image ids are
// seeded in source order), so the product's primary colour comes first.
function orderedColors(inventory: InventoryRow[], images: ImageRow[]): string[] {
  const imageOrder = new Map<string, number>();
  for (const image of images) {
    if (!imageOrder.has(image.color)) imageOrder.set(image.color, imageOrder.size);
  }
  const rank = (color: string) => imageOrder.get(color) ?? Number.MAX_SAFE_INTEGER;
  const colors = [...new Set(inventory.map((row) => row.color))];
  return colors.sort((first, second) => rank(first) - rank(second) || first.localeCompare(second));
}

export default function productRepository({ db }: Dependencies): ProductRepository {
  return {
    async findOneById(id: string): Promise<ProductEntity | undefined> {
      const [product]: [ProductRow?] =
        await db`SELECT product_id, name, description FROM products WHERE product_id = ${id} LIMIT 1`;
      if (!product) return undefined;

      const inventory: InventoryRow[] =
        await db`SELECT * FROM product_inventory WHERE product_id = ${id}`;
      const images: ImageRow[] =
        await db`SELECT color, image_url FROM product_images WHERE product_id = ${id} ORDER BY id`;
      const info: InfoRow[] =
        await db`SELECT title, description FROM product_info WHERE product_id = ${id} ORDER BY id`;
      const reviewSummary: ReviewSummaryRow[] = await db`
        SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average
        FROM product_reviews WHERE product_id = ${id}
      `;

      const colors = orderedColors(inventory, images);
      const colorRank = (color: string) => {
        const index = colors.indexOf(color);
        return index === -1 ? Number.MAX_SAFE_INTEGER : index;
      };

      const variants: ProductVariant[] = inventory
        .map((row) => ({
          sku: row.sku,
          color: row.color,
          size: row.size,
          listPrice: Number(row.list_price),
          salePrice: Number(row.sale_price),
          discountPercentage:
            row.discount_percentage === null ? null : Number(row.discount_percentage),
          stock: Number(row.stock),
          sold: Number(row.sold),
        }))
        .sort(
          (first, second) =>
            colorRank(first.color) - colorRank(second.color) ||
            sizeRank(first.size ?? '') - sizeRank(second.size ?? ''),
        );

      const sizes = [...new Set(variants.map((variant) => variant.size))]
        .filter((size): size is string => size !== null)
        .sort((first, second) => sizeRank(first) - sizeRank(second));

      return {
        id: product.product_id,
        name: product.name,
        description: product.description,
        colors,
        sizes,
        variants,
        images: images.map((image) => ({ color: image.color, url: image.image_url })),
        info: info.map((section) => ({ title: section.title, description: section.description })),
        reviews: {
          count: Number(reviewSummary[0].count),
          average: Number(reviewSummary[0].average),
        },
      };
    },
  };
}
