import * as stylex from '@stylexjs/stylex';
import { isDiscounted, type Price } from '@/shared/lib/price';
import { Badge } from '@/shared/ui/badge';
import { colors } from '@/shared/ui/tokens.stylex';
import { visuallyHidden } from '@/shared/ui/visually-hidden';

export type TPriceTagSize = 'sm' | 'lg';

export type TPriceTagProps = {
  price: Price;
  size?: TPriceTagSize;
  showBadge?: boolean;
  /** Cart rows show the sale price in the ink color and medium weight. */
  emphasized?: boolean;
};

// Card price (Figma: sale 18px/normal/tertiary, list 12px/muted strikethrough)
// differs from the detail-page price, not just in size but in weight and
// which token carries which role.
const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  prices: { display: 'flex', alignItems: 'baseline', gap: '0.5rem' },
  sale: {
    fontSize: '1.875rem',
    fontWeight: 500,
    lineHeight: 1,
    color: colors.muted,
  },
  saleSm: { fontSize: '1.125rem', fontWeight: 400, color: colors.tertiary },
  saleEmphasized: { fontWeight: 500, color: colors.ink },
  list: {
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontWeight: 400,
    color: colors.tertiary,
    textDecorationLine: 'line-through',
  },
  listSm: { fontSize: '0.75rem', lineHeight: '1rem', color: colors.muted },
});

export const PriceTag = ({
  price,
  size = 'lg',
  showBadge = true,
  emphasized = false,
}: TPriceTagProps) => {
  const hasDiscount = isDiscounted(price);
  const small = size === 'sm';

  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.prices)}>
        <span
          {...stylex.props(
            styles.sale,
            small && styles.saleSm,
            emphasized && styles.saleEmphasized,
          )}
        >
          ${price.sale}
        </span>
        {hasDiscount && (
          <span {...stylex.props(styles.list, small && styles.listSm)}>
            <span {...stylex.props(visuallyHidden.root)}>Original price </span>$
            {price.list}
          </span>
        )}
      </div>
      {showBadge && hasDiscount && (
        <Badge variant="warning">{price.discountPercentage}% OFF</Badge>
      )}
    </div>
  );
};
