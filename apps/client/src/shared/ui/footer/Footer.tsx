import * as stylex from '@stylexjs/stylex';
import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { media } from '@/shared/lib/breakpoints.stylex';
import { focusRing } from '@/shared/ui/focus-ring';
import { StyleNestLogo } from '@/shared/ui/logo';
import { transitions } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';
import {
  FacebookIcon,
  GithubIcon,
  InstagramIcon,
  XIcon,
  YoutubeIcon,
} from './icons';

export type TFooterProps = {
  newsletterSlot: ReactNode;
};

type TFooterLink = { label: string; href: LinkProps['to'] };

// No filtered category/collection routes exist yet (follow-up); every link
// points at the unfiltered products page until then.
const CATEGORY_LINKS: TFooterLink[] = [
  { label: 'Unisex', href: '/products' },
  { label: 'Women', href: '/products' },
  { label: 'Men', href: '/products' },
];
const COLLECTION_LINKS: TFooterLink[] = [
  { label: 'Latest arrivals', href: '/products' },
  { label: 'Urban Oasis', href: '/products' },
  { label: 'Cozy Comfort', href: '/products' },
  { label: 'Fresh Fusion', href: '/products' },
];

// Real social profile URLs are out of scope (issue #29); each points at a
// named placeholder fragment rather than a bare "#" so it has a real target.
const SOCIAL_LINKS = [
  { label: 'YouTube', href: '#youtube', Icon: YoutubeIcon },
  { label: 'Instagram', href: '#instagram', Icon: InstagramIcon },
  { label: 'Facebook', href: '#facebook', Icon: FacebookIcon },
  { label: 'GitHub', href: '#github', Icon: GithubIcon },
  { label: 'X', href: '#x', Icon: XIcon },
];

/*
 * StyleNest e-commerce footer (Figma `footer-multi-column-figma`, node 1004:7337).
 * The Figma file defines three discrete breakpoint variants (Mobile 375 /
 * Tablet 768 / Desktop 1440) rather than a fluid range, so — matching the
 * Navbar's own documented assumption — `md` (768) and `lg` (1024) stand in
 * for the Tablet and Desktop variants respectively.
 */
const styles = stylex.create({
  root: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    gap: { default: '3rem', [media.md]: '4rem' },
    paddingBlock: { default: '3rem', [media.md]: '4rem', [media.lg]: '6rem' },
  },
  container: {
    marginInline: 'auto',
    width: '100%',
    maxWidth: '1280px',
    paddingInline: { default: '1rem', [media.lg]: '2rem' },
  },
  // Newsletter section: heading+subtext stack above the form slot until `lg`,
  // where the design puts them side by side with the slot pinned to 400px.
  newsletterRow: {
    display: 'flex',
    flexDirection: { default: 'column', [media.lg]: 'row' },
    alignItems: { default: null, [media.lg]: 'flex-start' },
    justifyContent: { default: null, [media.lg]: 'space-between' },
    gap: { default: '1.5rem', [media.lg]: '4rem' },
  },
  newsletterCopy: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  newsletterHeading: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    fontWeight: 600,
    color: colors.ink,
  },
  newsletterSubtext: {
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: colors.muted,
  },
  newsletterSlot: {
    width: { default: '100%', [media.lg]: '400px' },
    flexShrink: { default: null, [media.lg]: 0 },
  },
  mainSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: '3rem', [media.md]: '4rem' },
  },
  // Logo+catchphrase stacks above the link columns until `lg`; from `lg` the
  // link columns move to a single row and are pushed to the right edge.
  mainRow: {
    display: 'flex',
    flexDirection: { default: 'column', [media.lg]: 'row' },
    alignItems: { default: null, [media.lg]: 'flex-start' },
    gap: '2rem',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: '1.5rem', [media.md]: '2rem' },
    maxWidth: { default: null, [media.md]: '320px', [media.lg]: '352px' },
  },
  logo: { height: '2rem', width: 'auto' },
  catchphrase: { fontSize: '1rem', lineHeight: '1.5rem', color: colors.muted },
  linkColumns: {
    display: 'flex',
    flexDirection: { default: 'column', [media.md]: 'row' },
    gap: '2rem',
    marginLeft: { default: null, [media.lg]: 'auto' },
  },
  linkColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: { default: null, [media.md]: '160px' },
  },
  linkHeading: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    color: colors.tertiary,
  },
  linkList: {
    display: 'flex',
    listStyle: 'none',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  link: {
    borderRadius: '0.25rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 500,
    color: {
      default: colors.muted,
      ':hover': { default: null, [media.hover]: colors.ink },
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  bottomRow: {
    display: 'flex',
    flexDirection: { default: 'column', [media.md]: 'row' },
    alignItems: { default: 'flex-start', [media.md]: 'center' },
    justifyContent: { default: null, [media.md]: 'space-between' },
    gap: '2rem',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    paddingTop: '2rem',
  },
  copyright: { fontSize: '1rem', lineHeight: '1.5rem', color: colors.tertiary },
  socialList: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  socialLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.25rem',
    color: {
      default: colors.tertiary,
      ':hover': { default: null, [media.hover]: colors.ink },
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  socialIcon: { height: '1.5rem', width: '1.5rem' },
});

export const Footer = ({ newsletterSlot }: TFooterProps) => {
  const year = new Date().getUTCFullYear();

  return (
    <footer {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.container, styles.newsletterRow)}>
        <div {...stylex.props(styles.newsletterCopy)}>
          <p {...stylex.props(styles.newsletterHeading)}>Join our newsletter</p>
          <p {...stylex.props(styles.newsletterSubtext)}>
            We&rsquo;ll send you a nice letter once per week. No spam.
          </p>
        </div>
        <div {...stylex.props(styles.newsletterSlot)}>{newsletterSlot}</div>
      </div>

      <div {...stylex.props(styles.mainSection)}>
        <div {...stylex.props(styles.container, styles.mainRow)}>
          <div {...stylex.props(styles.brand)}>
            <StyleNestLogo
              {...stylex.props(styles.logo)}
              aria-label="StyleNest"
            />
            <p {...stylex.props(styles.catchphrase)}>
              Craft stunning style journeys that weave more joy into every
              thread.
            </p>
          </div>

          <div {...stylex.props(styles.linkColumns)}>
            <FooterLinkColumn
              heading="Shop Categories"
              links={CATEGORY_LINKS}
            />
            <FooterLinkColumn
              heading="Shop Collections"
              links={COLLECTION_LINKS}
            />
          </div>
        </div>

        <div {...stylex.props(styles.container)}>
          <div {...stylex.props(styles.bottomRow)}>
            {/* The year is read from whichever clock renders it, so a client
                whose clock disagrees with the server's would otherwise tear
                the tree on hydration. The server's value stands. */}
            <p {...stylex.props(styles.copyright)} suppressHydrationWarning>
              © {year} StyleNest, Inc. All rights reserved.
            </p>
            <div {...stylex.props(styles.socialList)}>
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  {...stylex.props(styles.socialLink, focusRing.ring)}
                  aria-label={label}
                >
                  <Icon {...stylex.props(styles.socialIcon)} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

type TFooterLinkColumnProps = {
  heading: string;
  links: TFooterLink[];
};

const FooterLinkColumn = ({ heading, links }: TFooterLinkColumnProps) => (
  <div {...stylex.props(styles.linkColumn)}>
    <p {...stylex.props(styles.linkHeading)}>{heading}</p>
    <ul {...stylex.props(styles.linkList)}>
      {links.map((link) => (
        <li key={link.label}>
          <Link to={link.href} {...stylex.props(styles.link, focusRing.ring)}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);
