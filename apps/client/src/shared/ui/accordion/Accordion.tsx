import styles from './Accordion.module.css';

export type TAccordionProps = {
  title: string;
  items: string[];
  defaultOpen?: boolean;
};

export const Accordion = ({
  title,
  items,
  defaultOpen = true,
}: TAccordionProps) => (
  <details className={styles.root} open={defaultOpen}>
    <summary className={styles.summary}>
      <span className={styles.title}>{title}</span>
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" />
        <path
          d="M8 12h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          className={styles.iconVertical}
          d="M12 8v8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </summary>
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </details>
);
