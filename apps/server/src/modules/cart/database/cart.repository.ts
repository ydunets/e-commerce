import type { CartRepository } from '#src/modules/cart/database/cart.repository.port.ts';
import type {
  CartCoupon,
  CartDiscountType,
  CartEntity,
  StockChange,
} from '#src/modules/cart/domain/cart.types.ts';
import { withTransaction } from '#src/shared/db/postgres.ts';

interface CartRow {
  cart_id: string;
  created_at: string | Date;
  sku: string | null;
  quantity: number | null;
  product_id: string | null;
  name: string | null;
  color: string | null;
  size: string | null;
  image_url: string | null;
  list_price: string | null;
  discount_percentage: number | null;
  sale_price: string | null;
  stock: number | null;
}

// The FKs from cart_lines to product_inventory and products guarantee the
// joined columns whenever sku is present, so the sku check narrows them all.
type LineRow = CartRow & {
  sku: string;
  product_id: string;
  name: string;
  color: string;
  list_price: string;
  sale_price: string;
  stock: number;
};

interface CouponRow {
  code: string;
  discount_type: CartDiscountType;
  value: string;
}

export default function cartRepository({ db }: Dependencies): CartRepository {
  return {
    async insert(cart: CartEntity): Promise<void> {
      await db`INSERT INTO carts (cart_id, created_at) VALUES (${cart.id}, ${cart.createdAt})`;
    },

    async findOneById(id: string): Promise<CartEntity | undefined> {
      // Product data joins in here per line (the same trade as
      // review.repository.productExists: SQL beats a bus round-trip per line).
      const [rows, couponRows] = (await Promise.all([
        db`
          SELECT c.cart_id, c.created_at, l.sku, l.quantity,
            i.product_id, p.name, i.color, i.size, i.list_price,
            i.discount_percentage, i.sale_price, i.stock, img.image_url
          FROM carts c
          LEFT JOIN cart_lines l ON l.cart_id = c.cart_id
          LEFT JOIN product_inventory i ON i.sku = l.sku
          LEFT JOIN products p ON p.product_id = i.product_id
          LEFT JOIN LATERAL (
            SELECT image_url FROM product_images
            WHERE product_id = i.product_id AND color = i.color
            ORDER BY id LIMIT 1
          ) img ON true
          WHERE c.cart_id = ${id}
          ORDER BY l.created_at DESC, l.sku
        `,
        db`
          SELECT cc.code, co.discount_type, co.value
          FROM cart_coupons cc
          JOIN coupons co ON co.code = cc.code
          WHERE cc.cart_id = ${id}
          ORDER BY cc.created_at, cc.code
        `,
      ])) as unknown as [CartRow[], CouponRow[]];
      const [first] = rows;
      if (!first) return undefined;

      return {
        id: first.cart_id,
        createdAt: new Date(first.created_at),
        lines: rows
          .filter((row): row is LineRow => row.sku !== null)
          .map((row) => ({
            sku: row.sku,
            quantity: Number(row.quantity),
            productId: row.product_id,
            name: row.name,
            color: row.color,
            size: row.size,
            imageUrl: row.image_url,
            listPrice: Number(row.list_price),
            discountPercentage:
              row.discount_percentage === null ? null : Number(row.discount_percentage),
            salePrice: Number(row.sale_price),
            stock: Number(row.stock),
          })),
        coupons: couponRows.map((row) => ({
          code: row.code,
          discountType: row.discount_type,
          value: Number(row.value),
        })),
      };
    },

    async upsertLine(cartId: string, sku: string, quantity: number): Promise<void> {
      await db`
        INSERT INTO cart_lines (cart_id, sku, quantity)
        VALUES (${cartId}, ${sku}, ${quantity})
        ON CONFLICT (cart_id, sku) DO UPDATE SET quantity = EXCLUDED.quantity
      `;
    },

    async deleteLine(cartId: string, sku: string): Promise<boolean> {
      const result = await db`
        DELETE FROM cart_lines WHERE cart_id = ${cartId} AND sku = ${sku}
      `;
      return result.count > 0;
    },

    async findCouponByCode(code: string): Promise<CartCoupon | undefined> {
      const [row]: [CouponRow?] = await db`
        SELECT code, discount_type, value FROM coupons WHERE code = ${code} LIMIT 1
      `;
      return row
        ? { code: row.code, discountType: row.discount_type, value: Number(row.value) }
        : undefined;
    },

    async applyCoupon(cartId: string, code: string): Promise<void> {
      await db`
        INSERT INTO cart_coupons (cart_id, code)
        VALUES (${cartId}, ${code})
        ON CONFLICT (cart_id, code) DO NOTHING
      `;
    },

    async removeCoupon(cartId: string, code: string): Promise<boolean> {
      const result = await db`
        DELETE FROM cart_coupons WHERE cart_id = ${cartId} AND code = ${code}
      `;
      return result.count > 0;
    },

    async applyStockChanges(cartId: string, changes: StockChange[]): Promise<void> {
      await withTransaction(async (tx) => {
        for (const change of changes) {
          if (change.quantity === 0) {
            await tx`DELETE FROM cart_lines WHERE cart_id = ${cartId} AND sku = ${change.sku}`;
          } else {
            await tx`
              UPDATE cart_lines SET quantity = ${change.quantity}
              WHERE cart_id = ${cartId} AND sku = ${change.sku}
            `;
          }
        }
      });
    },
  };
}
