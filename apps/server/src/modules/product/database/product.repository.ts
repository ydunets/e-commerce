import type {
  FindManyProductsOptions,
  ProductRepository,
} from '#src/modules/product/database/product.repository.port.ts';
import {
  byColorThenSize,
  distinctSizes,
  orderedColors,
} from '#src/modules/product/domain/product.ordering.ts';
import type {
  ProductColorVariant,
  ProductEntity,
  ProductListItem,
  ProductVariant,
} from '#src/modules/product/domain/product.types.ts';

interface ProductRow {
  product_id: string;
  name: string;
  description: string;
}

interface ProductListRow {
  product_id: string;
  name: string;
  created_at: string | Date;
}

// Ordering and slicing happen here rather than in SQL so the newest-first
// contract is pinned by the fake-db spec; the catalog is small enough to list.
function byNewestFirst(first: ProductListRow, second: ProductListRow): number {
  return (
    new Date(second.created_at).getTime() - new Date(first.created_at).getTime() ||
    first.product_id.localeCompare(second.product_id)
  );
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

function toVariant(row: InventoryRow): ProductVariant {
  return {
    sku: row.sku,
    color: row.color,
    size: row.size,
    listPrice: Number(row.list_price),
    salePrice: Number(row.sale_price),
    discountPercentage: row.discount_percentage === null ? null : Number(row.discount_percentage),
    stock: Number(row.stock),
    sold: Number(row.sold),
  };
}

interface ListInventoryRow {
  product_id: string;
  color: string;
  list_price: string;
  sale_price: string;
  stock: number;
}

interface ListImageRow {
  product_id: string;
  color: string;
  image_url: string;
}

// Colours appear in first-inventory-appearance order; the first one is the
// card's default variant.
function toColorVariants(
  inventory: ListInventoryRow[],
  imageFor: (color: string) => string | null,
): ProductColorVariant[] {
  const colors = [...new Set(inventory.map((row) => row.color))];
  return colors.map((color) => {
    const rows = inventory.filter((row) => row.color === color);
    const cheapest = rows.reduce((lowest, row) =>
      Number(row.sale_price) < Number(lowest.sale_price) ? row : lowest,
    );
    return {
      color,
      imageUrl: imageFor(color),
      salePrice: Number(cheapest.sale_price),
      listPrice: Number(cheapest.list_price),
      outOfStock: rows.every((row) => Number(row.stock) === 0),
    };
  });
}

export default function productRepository({ db }: Dependencies): ProductRepository {
  return {
    async findMany(options: FindManyProductsOptions): Promise<ProductListItem[]> {
      const rows =
        (await db`SELECT product_id, name, created_at FROM products`) as unknown as ProductListRow[];

      const offset = options.offset ?? 0;
      const page = rows
        .toSorted(byNewestFirst)
        .slice(offset, options.limit === undefined ? undefined : offset + options.limit);
      if (page.length === 0) return [];

      const ids = page.map((row) => row.product_id);
      const [inventory, images] = (await Promise.all([
        db`SELECT product_id, color, list_price, sale_price, stock FROM product_inventory WHERE product_id = ANY(${ids})`,
        db`SELECT product_id, color, image_url FROM product_images WHERE product_id = ANY(${ids}) ORDER BY id`,
      ])) as unknown as [ListInventoryRow[], ListImageRow[]];

      const firstImages = new Map<string, string>();
      for (const image of images) {
        const key = `${image.product_id}:${image.color}`;
        if (!firstImages.has(key)) firstImages.set(key, image.image_url);
      }

      return page.map((row) => ({
        id: row.product_id,
        name: row.name,
        colors: toColorVariants(
          inventory.filter((item) => item.product_id === row.product_id),
          (color) => firstImages.get(`${row.product_id}:${color}`) ?? null,
        ),
      }));
    },

    async findOneById(id: string): Promise<Omit<ProductEntity, 'reviews'> | undefined> {
      const [product]: [ProductRow?] =
        await db`SELECT product_id, name, description FROM products WHERE product_id = ${id} LIMIT 1`;
      if (!product) return undefined;

      const [inventory, images, info] = (await Promise.all([
        db`SELECT * FROM product_inventory WHERE product_id = ${id}`,
        db`SELECT color, image_url FROM product_images WHERE product_id = ${id} ORDER BY id`,
        db`SELECT title, description FROM product_info WHERE product_id = ${id} ORDER BY id`,
      ])) as unknown as [InventoryRow[], ImageRow[], InfoRow[]];

      const colors = orderedColors(inventory, images);
      const variants = inventory.map(toVariant).sort(byColorThenSize(colors));

      return {
        id: product.product_id,
        name: product.name,
        description: product.description,
        colors,
        sizes: distinctSizes(variants),
        variants,
        images: images.map((image) => ({ color: image.color, url: image.image_url })),
        info: info.map((section) => ({ title: section.title, description: section.description })),
      };
    },
  };
}
