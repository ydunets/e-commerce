import type { CartRepository } from '#src/modules/cart/database/cart.repository.port.ts';
import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';

interface CartRow {
  cart_id: string;
  created_at: string | Date;
  sku: string | null;
  quantity: number | null;
}

export default function cartRepository({ db }: Dependencies): CartRepository {
  return {
    async insert(cart: CartEntity): Promise<void> {
      await db`INSERT INTO carts (cart_id, created_at) VALUES (${cart.id}, ${cart.createdAt})`;
    },

    async findOneById(id: string): Promise<CartEntity | undefined> {
      const rows = (await db`
        SELECT c.cart_id, c.created_at, l.sku, l.quantity
        FROM carts c
        LEFT JOIN cart_lines l ON l.cart_id = c.cart_id
        WHERE c.cart_id = ${id}
        ORDER BY l.created_at, l.sku
      `) as unknown as CartRow[];
      const [first] = rows;
      if (!first) return undefined;

      return {
        id: first.cart_id,
        createdAt: new Date(first.created_at),
        lines: rows
          .filter((row) => row.sku !== null)
          .map((row) => ({ sku: row.sku as string, quantity: Number(row.quantity) })),
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
  };
}
