import type { CartLineDto, CartResponseDto } from '@e-commerce/contracts';
import { useState } from 'react';
import { useRemoveCartLine, useUpdateCartLine } from '@/entities/cart';
import { CartLineRow } from './CartLineRow';
import styles from './CartLines.module.css';
import { RemoveLineDialog } from './RemoveLineDialog';

export type TCartLinesProps = {
  cart: CartResponseDto;
};

export const CartLines = ({ cart }: TCartLinesProps) => {
  const { updateQuantity, cancelPending } = useUpdateCartLine();
  const removeLine = useRemoveCartLine();
  const [removalCandidate, setRemovalCandidate] = useState<CartLineDto | null>(
    null,
  );

  const requestRemoval = (line: CartLineDto) => {
    removeLine.reset();
    setRemovalCandidate(line);
  };

  const confirmRemoval = () => {
    if (removalCandidate === null) {
      return;
    }
    cancelPending(removalCandidate.sku);
    removeLine.mutate(
      { cartId: cart.id, sku: removalCandidate.sku },
      { onSuccess: () => setRemovalCandidate(null) },
    );
  };

  return (
    <>
      <ul className={styles.list}>
        {cart.lines.map((line) => (
          <CartLineRow
            key={line.sku}
            line={line}
            onQuantityChange={(quantity) =>
              updateQuantity({ cartId: cart.id, sku: line.sku, quantity })
            }
            onRemoveRequest={() => requestRemoval(line)}
          />
        ))}
      </ul>

      <RemoveLineDialog
        line={removalCandidate}
        removing={removeLine.isPending}
        removeFailed={removeLine.isError}
        onCancel={() => setRemovalCandidate(null)}
        onConfirm={confirmRemoval}
      />
    </>
  );
};
