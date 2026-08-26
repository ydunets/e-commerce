import styles from './SpecificationSheet.module.css';

const SHEET_URL = '/spec-sheet.html';
const SHEET_TITLE = 'Care and materials';

export const SpecificationSheet = () => (
  <div className={styles.root}>
    <div className={styles.header}>
      <h3 className={styles.title}>{SHEET_TITLE}</h3>
      <a className={styles.download} href={SHEET_URL} download>
        Download specification sheet
      </a>
    </div>
    <iframe
      className={styles.frame}
      title={SHEET_TITLE}
      src={SHEET_URL}
      loading="lazy"
    />
  </div>
);
