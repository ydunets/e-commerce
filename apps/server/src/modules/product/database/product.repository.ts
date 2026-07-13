import type { ProductRepository } from '#src/modules/product/database/product.repository.port.ts';
import {
  byColorThenSize,
  distinctSizes,
  orderedColors,
} from '#src/modules/product/domain/product.ordering.ts';
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

export default function productRepository({ db }: Dependencies): ProductRepository {
  return {
    async findOneById(id: string): Promise<Omit<ProductEntity, 'reviews'> | undefined> {
      const [product]: [ProductRow?] =
        await db`SELECT product_id, name, description FROM products WHERE product_id = ${id} LIMIT 1`;
      if (!product) return undefined;

      const inventory: InventoryRow[] =
        await db`SELECT * FROM product_inventory WHERE product_id = ${id}`;
      const images: ImageRow[] =
        await db`SELECT color, image_url FROM product_images WHERE product_id = ${id} ORDER BY id`;
      const info: InfoRow[] =
        await db`SELECT title, description FROM product_info WHERE product_id = ${id} ORDER BY id`;

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
