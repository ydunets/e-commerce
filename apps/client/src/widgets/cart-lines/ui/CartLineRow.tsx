import type { CartLineDto } from '@e-commerce/contracts';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { colorLabel, sizeLabel } from '@/entities/product';
import { supabaseImage } from '@/shared/lib/image';
import type { Price } from '@/shared/lib/price';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { PriceTag } from '@/shared/ui/price-tag';
import { QuantityStepper } from '@/shared/ui/quantity-stepper';
import styles from './CartLineRow.module.css';

export type TCartLineRowProps = {
  line: CartLineDto;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  removing?: boolean;
  removeFailed?: boolean;
};

const LINE_IMAGE_WIDTH = 560;
const LINE_IMAGE_HEIGHT = 400;

export const CartLineRow = ({
  line,
  onQuantityChange,
  onRemove,
  removing = false,
  removeFailed = false,
}: TCartLineRowProps) => {
  const [confirming, setConfirming] = useState(false);

  const price: Price = {
    sale: line.sale_price,
    list: line.list_price,
    discountPercentage: line.discount_percentage,
  };

  return (
    <li className={styles.root}>
      <Link
        to="/products/$productId"
        params={{ productId: line.product_id }}
        className={styles.imageLink}
        tabIndex={-1}
        aria-hidden="true"
      >
        {line.image_url === null ? (
          <div className={styles.imageFallback} />
        ) : (
          <img
            src={supabaseImage(line.image_url, {
              width: LINE_IMAGE_WIDTH,
              height: LINE_IMAGE_HEIGHT,
              resize: 'cover',
            })}
            alt=""
            className={styles.image}
          />
        )}
      </Link>

      <div className={styles.details}>
        <Link
          to="/products/$productId"
          params={{ productId: line.product_id }}
          className={styles.nameLink}
        >
          {line.name}
        </Link>
        <p className={styles.specs}>
          {colorLabel(line.color)}
          {line.size !== null && ` • ${sizeLabel(line.size)}`}
        </p>

        <div className={styles.controls}>
          <QuantityStepper
            value={line.quantity}
            max={line.stock}
            onChange={onQuantityChange}
          />
          <button
            type="button"
            className={styles.remove}
            onClick={() => setConfirming(true)}
          >
            Remove
          </button>
          <div className={styles.price}>
            <PriceTag price={price} size="sm" showBadge={false} />
          </div>
        </div>
      </div>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        label="Confirm item removal"
        size="sm"
      >
        <div className={styles.confirm}>
          <h2 className={styles.confirmTitle}>Confirm Item Removal</h2>
          <p className={styles.confirmBody}>
            Are you sure you want to remove "{line.name}" from your shopping
            cart?
          </p>
          <div className={styles.confirmActions}>
            <Button
              variant="secondary"
              className={styles.confirmAction}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              className={styles.confirmAction}
              disabled={removing}
              onClick={onRemove}
            >
              Yes
            </Button>
          </div>
          {removeFailed && (
            <p role="alert" className={styles.confirmError}>
              Couldn't remove the item. Please try again.
            </p>
          )}
        </div>
      </Dialog>
    </li>
  );
};
