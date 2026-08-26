import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';
import { StyleNestLogo } from '@/shared/ui/logo';
import styles from './Footer.module.css';
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

export const Footer = ({ newsletterSlot }: TFooterProps) => {
  const year = new Date().getUTCFullYear();

  return (
    <footer className={styles.root}>
      <div className={cx(styles.container, styles.newsletterRow)}>
        <div className={styles.newsletterCopy}>
          <p className={styles.newsletterHeading}>Join our newsletter</p>
          <p className={styles.newsletterSubtext}>
            We&rsquo;ll send you a nice letter once per week. No spam.
          </p>
        </div>
        <div className={styles.newsletterSlot}>{newsletterSlot}</div>
      </div>

      <div className={styles.mainSection}>
        <div className={cx(styles.container, styles.mainRow)}>
          <div className={styles.brand}>
            <StyleNestLogo className={styles.logo} aria-label="StyleNest" />
            <p className={styles.catchphrase}>
              Craft stunning style journeys that weave more joy into every
              thread.
            </p>
          </div>

          <div className={styles.linkColumns}>
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

        <div className={styles.container}>
          <div className={styles.bottomRow}>
            {/* The year is read from whichever clock renders it, so a client
                whose clock disagrees with the server's would otherwise tear
                the tree on hydration. The server's value stands. */}
            <p className={styles.copyright} suppressHydrationWarning>
              © {year} StyleNest, Inc. All rights reserved.
            </p>
            <div className={styles.socialList}>
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  className={styles.socialLink}
                  aria-label={label}
                >
                  <Icon className={styles.socialIcon} />
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
  <div className={styles.linkColumn}>
    <p className={styles.linkHeading}>{heading}</p>
    <ul className={styles.linkList}>
      {links.map((link) => (
        <li key={link.label}>
          <Link to={link.href} className={styles.link}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);
