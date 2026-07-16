import { useState } from 'react';
import { Tabs, tabButtonId, tabPanelId } from '@/shared/ui/tabs';
import { SPECIFICATIONS } from '../lib/specifications';
import styles from './ProductSpecificationsSection.module.css';

const TABS_ID_PREFIX = 'product-specifications';

const TAB_ITEMS = SPECIFICATIONS.map(({ id, tab }) => ({ id, label: tab }));

export const ProductSpecificationsSection = () => {
  const [activeId, setActiveId] = useState(SPECIFICATIONS[0].id);
  const [visitedIds, setVisitedIds] = useState([SPECIFICATIONS[0].id]);

  const selectTab = (id: string) => {
    setActiveId(id);
    setVisitedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  };

  return (
    <section className={styles.root} aria-label="Product specifications">
      <div className={styles.header}>
        <h2 className={styles.heading}>Discover timeless elegance</h2>
        <p className={styles.intro}>
          Step into a world where quality meets quintessential charm with our
          collection. Every thread weaves a promise of unparalleled quality,
          ensuring that each garment is not just a part of your wardrobe, but a
          piece of art. Here&apos;s the essence of what makes our apparel the
          hallmark for those with an eye for excellence and a heart for the
          environment.
        </p>
      </div>

      <div className={styles.information}>
        <Tabs
          tabs={TAB_ITEMS}
          activeId={activeId}
          onChange={selectTab}
          label="Product features"
          idPrefix={TABS_ID_PREFIX}
        />

        {SPECIFICATIONS.map((spec) => (
          <div
            key={spec.id}
            id={tabPanelId(TABS_ID_PREFIX, spec.id)}
            role="tabpanel"
            aria-labelledby={tabButtonId(TABS_ID_PREFIX, spec.id)}
            hidden={spec.id !== activeId}
            className={styles.panel}
          >
            {visitedIds.includes(spec.id) && (
              <>
                <img
                  className={styles.image}
                  src={spec.image}
                  alt={spec.imageAlt}
                  loading="lazy"
                  decoding="async"
                />
                <div className={styles.description}>
                  <div className={styles.textPair}>
                    <h3 className={styles.title}>{spec.title}</h3>
                    <p className={styles.text}>{spec.description}</p>
                  </div>
                  <ul className={styles.featureList}>
                    {spec.features.map(({ icon: Icon, label }) => (
                      <li key={label} className={styles.feature}>
                        <span className={styles.featureIcon}>
                          <Icon className={styles.icon} />
                        </span>
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
