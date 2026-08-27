import type { CartLineDto } from '@e-commerce/contracts';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import styles from './RemoveLineDialog.module.css';

export type TRemoveLineDialogProps = {
  line: CartLineDto | null;
  removing: boolean;
  removeFailed: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

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
    <div className={styles.root}>
      <h2 className={styles.title}>Confirm Item Removal</h2>
      <p className={styles.body}>
        Are you sure you want to remove "{line?.name}" from your shopping cart?
      </p>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          className={styles.action}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          className={styles.action}
          disabled={removing}
          onClick={onConfirm}
        >
          Yes
        </Button>
      </div>
      {removeFailed && (
        <p role="alert" className={styles.error}>
          Couldn't remove the item. Please try again.
        </p>
      )}
    </div>
  </Dialog>
);
