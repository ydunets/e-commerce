import type { CartLineDto } from '@e-commerce/contracts';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { colors } from '@/shared/ui/tokens.stylex';

export type TRemoveLineDialogProps = {
  line: CartLineDto | null;
  removing: boolean;
  removeFailed: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1.5rem',
  },
  title: {
    paddingRight: '2rem',
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontWeight: 600,
    color: colors.ink,
  },
  body: { fontSize: '0.875rem', lineHeight: '1.25rem', color: colors.muted },
  actions: { marginTop: '1rem', display: 'flex', gap: '0.75rem' },
  action: { flexGrow: 1, flexShrink: 1, flexBasis: '0%' },
  error: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: colors.danger,
  },
});

export const RemoveLineDialog = ({
  line,
  removing,
  removeFailed,
  onCancel,
  onConfirm,
}: TRemoveLineDialogProps) => (
  <Dialog
    open={line !== null}
    onClose={onCancel}
    label="Confirm item removal"
    size="sm"
  >
    <div {...stylex.props(styles.root)}>
      <h2 {...stylex.props(styles.title)}>Confirm Item Removal</h2>
      <p {...stylex.props(styles.body)}>
        Are you sure you want to remove "{line?.name}" from your shopping cart?
      </p>
      <div {...stylex.props(styles.actions)}>
        <Button variant="secondary" style={styles.action} onClick={onCancel}>
          Cancel
        </Button>
        <Button style={styles.action} disabled={removing} onClick={onConfirm}>
          Yes
        </Button>
      </div>
      {removeFailed && (
        <p role="alert" {...stylex.props(styles.error)}>
          Couldn't remove the item. Please try again.
        </p>
      )}
    </div>
  </Dialog>
);
