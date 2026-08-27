import type { CartLineDto, CartResponseDto } from '@e-commerce/contracts';
import { useRemoveCartLine, useUpdateCartLine } from '@/entities/cart';
import { CartLineRow } from './CartLineRow';
import styles from './CartLines.module.css';

export type TCartLinesProps = {
  cart: CartResponseDto;
};

type TCartLineProps = {
  cartId: string;
  line: CartLineDto;
};

const CartLine = ({ cartId, line }: TCartLineProps) => {
  const { updateQuantity } = useUpdateCartLine();
  const removeLine = useRemoveCartLine();

  return (
    <CartLineRow
      line={line}
      onQuantityChange={(quantity) =>
        updateQuantity({ cartId, sku: line.sku, quantity })
      }
      onRemove={() => removeLine.mutate({ cartId, sku: line.sku })}
      removing={removeLine.isPending}
      removeFailed={removeLine.isError}
    />
  );
};

export const CartLines = ({ cart }: TCartLinesProps) => (
  <ul className={styles.list}>
    {cart.lines.map((line) => (
      <CartLine key={line.sku} cartId={cart.id} line={line} />
    ))}
  </ul>
);
