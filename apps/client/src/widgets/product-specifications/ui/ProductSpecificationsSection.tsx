import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import type { Specification } from '@/entities/specification';
import { media } from '@/shared/lib/breakpoints.stylex';
import { focusRing } from '@/shared/ui/focus-ring';
import { Tabs, tabButtonId, tabPanelId } from '@/shared/ui/tabs';
import { colors, shadows } from '@/shared/ui/tokens.stylex';
import { getSpecificationIcon } from '../lib/icon-map';

const TABS_ID_PREFIX = 'product-specifications';

interface ProductSpecificationsSectionProps {
  specifications: Specification[];
}

const fadeIn = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4rem',
    paddingInline: { default: '1rem', [media.lg]: '6rem' },
    paddingBlock: { default: '3rem', [media.md]: '4rem', [media.lg]: '6rem' },
  },
  header: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  heading: {
    fontSize: { default: '1.875rem', [media.md]: '3rem' },
    lineHeight: { default: '2.25rem', [media.md]: '3rem' },
    fontWeight: 600,
    color: colors.ink,
  },
  intro: { fontSize: '1.125rem', lineHeight: '1.75rem', color: colors.muted },
  information: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    gap: '2rem',
  },
  panel: {
    display: { default: 'flex', '[hidden]': 'none' },
    flexDirection: { default: 'column', [media.lg]: 'row' },
    alignItems: { default: null, [media.lg]: 'flex-start' },
    gap: '2rem',
    borderRadius: '0.375rem',
    animationName: {
      default: fadeIn,
      '@media (prefers-reduced-motion: reduce)': 'none',
    },
    animationDuration: '250ms',
    animationTimingFunction: 'ease',
  },
  image: {
    height: { default: '11.25rem', [media.md]: '24rem', [media.lg]: '16rem' },
    width: { default: '100%', [media.lg]: '367px' },
    flexShrink: { default: null, [media.lg]: 0 },
    borderRadius: '0.5rem',
    objectFit: 'cover',
  },
  description: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    minWidth: { default: null, [media.lg]: 0 },
    flexGrow: { default: null, [media.lg]: 1 },
    flexShrink: { default: null, [media.lg]: 1 },
    flexBasis: { default: null, [media.lg]: '0%' },
  },
  textPair: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  title: {
    fontSize: '1.5rem',
    lineHeight: '2rem',
    fontWeight: 500,
    color: colors.ink,
  },
  text: { fontSize: '1rem', lineHeight: '1.5rem', color: colors.muted },
  featureList: {
    margin: 0,
    display: 'flex',
    listStyle: 'none',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    columnGap: { default: '1rem', [media.md]: '3rem', [media.lg]: '2rem' },
    rowGap: { default: '1rem', [media.md]: '2rem' },
    paddingTop: 0,
    paddingInline: 0,
    paddingBottom: { default: '0.25rem', [media.md]: 0 },
  },
  feature: {
    display: 'flex',
    width: { default: '259px', [media.md]: '320px', [media.lg]: '282px' },
    alignItems: 'center',
    gap: { default: '0.5rem', [media.md]: '1rem' },
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: { default: null, [media.md]: 500, [media.lg]: 400 },
    color: colors.muted,
  },
  featureIcon: {
    display: 'flex',
    width: '3rem',
    height: '3rem',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    backgroundColor: '#fff',
    color: colors.brand,
    boxShadow: shadows.card,
  },
  icon: { width: '1.5rem', height: '1.5rem' },
});

export const ProductSpecificationsSection = ({
  specifications,
}: ProductSpecificationsSectionProps) => {
  const [activeId, setActiveId] = useState(specifications[0].id);
  const [visitedIds, setVisitedIds] = useState([specifications[0].id]);

  const selectTab = (id: string) => {
    setActiveId(id);
    setVisitedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  };

  const tabItems = specifications.map(({ id, label }) => ({ id, label }));

  return (
    <section {...stylex.props(styles.root)} aria-label="Product specifications">
      <div {...stylex.props(styles.header)}>
        <h2 {...stylex.props(styles.heading)}>Discover timeless elegance</h2>
        <p {...stylex.props(styles.intro)}>
          Step into a world where quality meets quintessential charm with our
          collection. Every thread weaves a promise of unparalleled quality,
          ensuring that each garment is not just a part of your wardrobe, but a
          piece of art. Here&apos;s the essence of what makes our apparel the
          hallmark for those with an eye for excellence and a heart for the
          environment.
        </p>
      </div>

      <div {...stylex.props(styles.information)}>
        <Tabs
          tabs={tabItems}
          activeId={activeId}
          onChange={selectTab}
          label="Product features"
          idPrefix={TABS_ID_PREFIX}
        />

        {specifications.map((spec) => (
          <div
            key={spec.id}
            id={tabPanelId(TABS_ID_PREFIX, spec.id)}
            role="tabpanel"
            aria-labelledby={tabButtonId(TABS_ID_PREFIX, spec.id)}
            hidden={spec.id !== activeId}
            {...stylex.props(styles.panel, focusRing.ring)}
          >
            {visitedIds.includes(spec.id) && (
              <>
                <img
                  {...stylex.props(styles.image)}
                  src={spec.imageUrl}
                  alt={spec.imageAlt}
                  loading="lazy"
                  decoding="async"
                />
                <div {...stylex.props(styles.description)}>
                  <div {...stylex.props(styles.textPair)}>
                    <h3 {...stylex.props(styles.title)}>{spec.title}</h3>
                    <p {...stylex.props(styles.text)}>{spec.description}</p>
                  </div>
                  <ul {...stylex.props(styles.featureList)}>
                    {spec.features.map(({ icon, label }) => {
                      const Icon = getSpecificationIcon(icon);
                      return (
                        <li key={label} {...stylex.props(styles.feature)}>
                          {Icon && (
                            <span {...stylex.props(styles.featureIcon)}>
                              <Icon {...stylex.props(styles.icon)} />
                            </span>
                          )}
                          {label}
                        </li>
                      );
                    })}
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
