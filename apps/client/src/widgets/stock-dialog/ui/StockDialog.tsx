import * as stylex from '@stylexjs/stylex';
import { useAcknowledgeStock, useCart, useCartState } from '@/entities/cart';
import { colorLabel, sizeLabel, type Product } from '@/entities/product';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { colors } from '@/shared/ui/tokens.stylex';

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    overflowY: 'auto',
  },
  title: {
    paddingRight: '2rem',
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontWeight: 600,
    color: colors.ink,
  },
  body: { fontSize: '0.875rem', lineHeight: '1.25rem', color: colors.muted },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  name: { fontWeight: 600, color: colors.ink },
  error: { color: colors.danger, fontSize: '0.875rem', lineHeight: '1.25rem' },
});

export const StockDialog = ({ product }: { product?: Product }) => {
  const { data: cart } = useCart();
  const { stock, error } = useCartState();
  const { acknowledge, isPending } = useAcknowledgeStock();

  return (
    <Dialog
      open={stock !== null}
      onClose={acknowledge}
      label="Insufficient stock"
      size="sm"
    >
      <div {...stylex.props(styles.root)} aria-busy={isPending}>
        <h2 {...stylex.props(styles.title)}>Insufficient stock</h2>
        <p {...stylex.props(styles.body)}>
          Stock availability has changed. Please review the affected items.
        </p>
        <ul {...stylex.props(styles.list)}>
          {stock?.changes.map((change) => {
            const cartLine = cart?.lines.find(
              (line) => line.sku === change.sku,
            );
            const productVariant = product?.variants.find(
              (item) => item.sku === change.sku,
            );
            const variant = cartLine ?? productVariant;
            return (
              <li key={change.sku} {...stylex.props(styles.body)}>
                <p {...stylex.props(styles.name)}>
                  {cartLine?.name ??
                    (productVariant ? product?.name : change.name)}
                </p>
                {variant && (
                  <p>
                    {colorLabel(variant.color)}
                    {variant.size !== null && ` • ${sizeLabel(variant.size)}`}
                  </p>
                )}
                <p>
                  Requested: {change.previous_quantity}. Available:{' '}
                  {change.stock}.
                </p>
                {stock.correctedCart ? (
                  <p>
                    {change.quantity === 0
                      ? 'This item has been removed from your cart.'
                      : `Quantity updated to ${change.quantity}.`}
                  </p>
                ) : (
                  <p>
                    {change.stock === 0
                      ? 'This item is no longer available.'
                      : 'The requested change was not saved.'}{' '}
                    Your cart will be refreshed when you acknowledge.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {error && (
          <p role="alert" {...stylex.props(styles.error)}>
            {error}
          </p>
        )}
        <Button onClick={acknowledge} disabled={isPending}>
          Ok
        </Button>
      </div>
    </Dialog>
  );
};
