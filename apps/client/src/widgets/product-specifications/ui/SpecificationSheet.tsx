import type { Specification } from '@/entities/specification';
import { Button } from '@/shared/ui/button';
import styles from './SpecificationSheet.module.css';

export type TSpecificationSheetProps = {
  specifications: Specification[];
};

const SHEET_URL = '/spec-sheet.html';
const SHEET_TITLE = 'Care and materials';
const SHEET_FILE_NAME = 'stylenest-specification-sheet.csv';
const SHEET_MIME_TYPE = 'text/csv';
const CSV_COLUMNS = ['section', 'feature'] as const;

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

const toCsv = (specifications: Specification[]) =>
  [
    CSV_COLUMNS.join(','),
    ...specifications.flatMap((specification) =>
      specification.features.map((feature) =>
        [specification.label, feature.label].map(csvCell).join(','),
      ),
    ),
  ].join('\n');

export const SpecificationSheet = ({
  specifications,
}: TSpecificationSheetProps) => {
  const download = () => {
    const blob = new Blob([toCsv(specifications)], { type: SHEET_MIME_TYPE });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = SHEET_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.title}>{SHEET_TITLE}</h3>
        <Button variant="secondary" onClick={download}>
          Download specification sheet
        </Button>
      </div>
      <iframe
        className={styles.frame}
        title={SHEET_TITLE}
        src={SHEET_URL}
        loading="lazy"
      />
    </div>
  );
};
