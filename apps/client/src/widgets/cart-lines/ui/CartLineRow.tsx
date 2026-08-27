import type { CartLineDto } from '@e-commerce/contracts';
import { Link } from '@tanstack/react-router';
import { colorLabel, sizeLabel } from '@/entities/product';
import { supabaseImage } from '@/shared/lib/image';
import type { Price } from '@/shared/lib/price';
import { PriceTag } from '@/shared/ui/price-tag';
import { QuantityStepper } from '@/shared/ui/quantity-stepper';
import styles from './CartLineRow.module.css';

export type TCartLineRowProps = {
  line: CartLineDto;
  onQuantityChange: (quantity: number) => void;
  onRemoveRequest: () => void;
};

const LINE_IMAGE_WIDTH = 560;
const LINE_IMAGE_HEIGHT = 400;

export const CartLineRow = ({
  line,
  onQuantityChange,
  onRemoveRequest,
}: TCartLineRowProps) => {
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
        <p className={styles.description}>{line.description}</p>

        <div className={styles.controls}>
          <QuantityStepper
            value={line.quantity}
            max={line.stock}
            onChange={onQuantityChange}
          />
          <button
            type="button"
            className={styles.remove}
            onClick={onRemoveRequest}
          >
            Remove
          </button>
          <div className={styles.price}>
            <PriceTag price={price} size="sm" showBadge={false} emphasized />
          </div>
        </div>
      </div>
    </li>
  );
};
