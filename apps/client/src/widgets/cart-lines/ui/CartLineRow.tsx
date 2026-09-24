import type { CartLineDto } from '@e-commerce/contracts';
import * as stylex from '@stylexjs/stylex';
import { Link } from '@tanstack/react-router';
import { colorLabel, sizeLabel } from '@/entities/product';
import { media } from '@/shared/lib/breakpoints.stylex';
import { supabaseImage } from '@/shared/lib/image';
import type { Price } from '@/shared/lib/price';
import { focusRing } from '@/shared/ui/focus-ring';
import { transitions } from '@/shared/ui/motion.stylex';
import { PriceTag } from '@/shared/ui/price-tag';
import { QuantityStepper } from '@/shared/ui/quantity-stepper';
import { colors } from '@/shared/ui/tokens.stylex';

export type TCartLineRowProps = {
  line: CartLineDto;
  readOnly?: boolean;
  disabled?: boolean;
  onQuantityChange?: (quantity: number) => void;
  onRemoveRequest?: () => void;
};

const LINE_IMAGE_WIDTH = 560;
const LINE_IMAGE_HEIGHT = 400;

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: { default: 'column', [media.md]: 'row' },
    gap: { default: '1rem', [media.md]: '2rem' },
    paddingTop: { default: '2rem', ':first-child': 0 },
    paddingBottom: '2rem',
    borderTopWidth: { default: '1px', ':first-child': 0 },
    borderTopStyle: 'dashed',
    borderTopColor: colors.lineStrong,
  },
  imageLink: {
    display: 'block',
    flexShrink: 0,
    borderRadius: '0.5rem',
    width: { default: null, [media.md]: '280px' },
  },
  image: {
    height: { default: '180px', [media.md]: '200px' },
    width: '100%',
    borderRadius: '0.5rem',
    objectFit: 'cover',
  },
  imageFallback: { backgroundColor: colors.surface },
  details: {
    display: 'flex',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: { default: '0.5rem', [media.md]: '1rem' },
  },
  nameLink: {
    borderRadius: '0.25rem',
    fontSize: { default: '1.125rem', [media.md]: '1.5rem' },
    lineHeight: { default: '1.75rem', [media.md]: '2rem' },
    fontWeight: 500,
    color: colors.ink,
  },
  specs: {
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 500,
    color: colors.muted,
  },
  description: {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: colors.muted,
  },
  controls: {
    marginTop: 'auto',
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: '1rem',
    paddingTop: '1rem',
  },
  remove: {
    cursor: 'pointer',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 500,
    color: {
      default: colors.muted,
      ':hover': { default: null, [media.hover]: colors.ink },
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  price: { marginLeft: 'auto' },
});

export const CartLineRow = ({
  line,
  readOnly = false,
  disabled = false,
  onQuantityChange,
  onRemoveRequest,
}: TCartLineRowProps) => {
  const price: Price = {
    sale: line.sale_price,
    list: line.list_price,
    discountPercentage: line.discount_percentage,
  };

  return (
    <li {...stylex.props(styles.root)}>
      <Link
        to="/products/$productId"
        params={{ productId: line.product_id }}
        {...stylex.props(styles.imageLink, focusRing.ring)}
        tabIndex={-1}
        aria-hidden="true"
      >
        {line.image_url === null ? (
          <div {...stylex.props(styles.image, styles.imageFallback)} />
        ) : (
          <img
            src={supabaseImage(line.image_url, {
              width: LINE_IMAGE_WIDTH,
              height: LINE_IMAGE_HEIGHT,
              resize: 'cover',
            })}
            alt=""
            {...stylex.props(styles.image)}
          />
        )}
      </Link>

      <div {...stylex.props(styles.details)}>
        <Link
          to="/products/$productId"
          params={{ productId: line.product_id }}
          {...stylex.props(styles.nameLink, focusRing.ring)}
        >
          {line.name}
        </Link>
        <p {...stylex.props(styles.specs)}>
          {colorLabel(line.color)}
          {line.size !== null && ` • ${sizeLabel(line.size)}`}
        </p>
        <p {...stylex.props(styles.description)}>{line.description}</p>

        <div {...stylex.props(styles.controls)}>
          {readOnly ? (
            <p {...stylex.props(styles.specs)}>Quantity: {line.quantity}</p>
          ) : (
            <>
              <QuantityStepper
                disabled={disabled}
                value={line.quantity}
                max={line.stock}
                onChange={(quantity) => onQuantityChange?.(quantity)}
              />
              <button
                type="button"
                {...stylex.props(styles.remove, focusRing.ring)}
                disabled={disabled}
                onClick={onRemoveRequest}
              >
                Remove
              </button>
            </>
          )}
          <div {...stylex.props(styles.price)}>
            <PriceTag price={price} size="sm" showBadge={false} emphasized />
          </div>
        </div>
      </div>
    </li>
  );
};
