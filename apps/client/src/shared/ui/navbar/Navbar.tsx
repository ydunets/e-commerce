import { Link, type LinkProps } from '@tanstack/react-router';
import { useId, useRef, useState } from 'react';
import { cx } from '@/shared/lib/cx';
import { useMediaQuery } from '@/shared/lib/useMediaQuery';
import { CloseIcon, MenuIcon, ShoppingBagIcon, StyleNestLogo } from './icons';
import styles from './Navbar.module.css';

export type TNavbarLink = {
  label: string;
  href: LinkProps['to'];
  params?: LinkProps['params'];
};

export type TNavbarProps = {
  links?: TNavbarLink[];
  brandHref?: LinkProps['to'];
  brandLabel?: string;
  cartHref?: LinkProps['to'];
  cartLabel?: string;
};

const DEFAULT_LINKS: TNavbarLink[] = [{ label: 'Home', href: '/' }];

export const Navbar = ({
  links = DEFAULT_LINKS,
  brandHref = '/',
  brandLabel = 'StyleNest home',
  cartHref = '/',
  cartLabel = 'Shopping bag',
}: TNavbarProps) => {
  const drawerId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // The drawer only exists below the desktop breakpoint. Crossing up unmounts
  // the <dialog> without firing onClose, so reconcile the flag during render
  // instead of in an effect (docs/react/you-might-not-need-an-effect.md §4).
  if (isDesktop && open) {
    setOpen(false);
  }

  const openDrawer = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };
  const closeDrawer = () => dialogRef.current?.close();

  return (
    <header className={styles.root}>
      <div className={styles.container}>
        <div className={styles.leftCluster}>
          <Link to={brandHref} className={styles.brand} aria-label={brandLabel}>
            <StyleNestLogo className={styles.logo} aria-label="StyleNest" />
          </Link>

          <nav className={styles.desktopNav} aria-label="Main">
            <ul className={styles.navList}>
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    params={link.params}
                    className={styles.link}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.actions}>
          <Link
            to={cartHref}
            className={styles.iconButton}
            aria-label={cartLabel}
          >
            <ShoppingBagIcon className={styles.icon} />
          </Link>

          <button
            type="button"
            className={cx(styles.iconButton, styles.menuButton)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={drawerId}
            onClick={openDrawer}
          >
            <MenuIcon className={styles.icon} />
          </button>
        </div>
      </div>

      {!isDesktop && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-close; <dialog> handles Esc natively.
        <dialog
          id={drawerId}
          ref={dialogRef}
          data-navbar-drawer
          className={styles.drawer}
          aria-label="Site menu"
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === dialogRef.current) closeDrawer();
          }}
        >
          <div className={styles.drawerInner}>
            <div className={styles.drawerHeader}>
              <StyleNestLogo className={styles.logo} aria-label="StyleNest" />
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Close menu"
                onClick={closeDrawer}
              >
                <CloseIcon className={styles.icon} />
              </button>
            </div>

            <nav className={styles.drawerNav} aria-label="Mobile">
              <ul className={styles.drawerList}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      params={link.params}
                      className={styles.drawerLink}
                      onClick={closeDrawer}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </dialog>
      )}
    </header>
  );
};
