import * as stylex from '@stylexjs/stylex';
import { Link, type LinkProps } from '@tanstack/react-router';
import { useId, useRef, useState } from 'react';
import { DESKTOP_MEDIA_QUERY } from '@/shared/lib/breakpoints';
import { media } from '@/shared/lib/breakpoints.stylex';
import { useMediaQuery } from '@/shared/lib/useMediaQuery';
import { focusRing } from '@/shared/ui/focus-ring';
import { StyleNestLogo } from '@/shared/ui/logo';
import { transitions } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';
import { CloseIcon, MenuIcon, ShoppingBagIcon } from './icons';

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
  cartCount?: number;
};

const cartAccessibleLabel = (label: string, count: number) => {
  if (count === 0) return label;
  return count === 1 ? `${label}, 1 item` : `${label}, ${count} items`;
};

const DEFAULT_LINKS: TNavbarLink[] = [{ label: 'Home', href: '/' }];

// Inline links collapse into the hamburger drawer below `lg` (1024px). The
// drawer is a native <dialog> opened with showModal(); the transform, overlay
// and display transitions plus @starting-style animate the slide-in even
// though the dialog toggles `display` on open and close (Baseline 2024).
const DRAWER_TRANSITION =
  'transform 200ms ease-out, overlay 200ms ease-out allow-discrete, display 200ms ease-out allow-discrete';
const BACKDROP_TRANSITION =
  'opacity 200ms ease-out, overlay 200ms ease-out allow-discrete, display 200ms ease-out allow-discrete';

const styles = stylex.create({
  root: { width: '100%' },
  container: {
    marginInline: 'auto',
    display: 'flex',
    maxWidth: '1280px',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingInline: { default: '1rem', [media.md]: '2rem' },
    paddingBlock: { default: '1.25rem', [media.lg]: '1.75rem' },
  },
  leftCluster: {
    display: 'flex',
    alignItems: 'center',
    columnGap: { default: '2.5rem', [media.lg]: '3.5rem' },
  },
  brand: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    borderRadius: '0.25rem',
  },
  logo: { height: '2rem', width: 'auto' },
  desktopNav: { display: { default: 'none', [media.lg]: 'block' } },
  navList: {
    display: 'flex',
    listStyle: 'none',
    alignItems: 'center',
    columnGap: '2rem',
  },
  link: {
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: {
      default: colors.muted,
      ':hover': { default: null, [media.hover]: colors.ink },
    },
    borderRadius: '0.25rem',
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  actions: { display: 'flex', alignItems: 'center', columnGap: '0.5rem' },
  iconButton: {
    position: 'relative',
    display: 'inline-flex',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.25rem',
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: '0.25rem',
    color: {
      default: colors.muted,
      ':hover': { default: null, [media.hover]: colors.ink },
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  cartBadge: {
    position: 'absolute',
    right: '-0.25rem',
    top: '-0.25rem',
    display: 'flex',
    height: '1rem',
    minWidth: '1rem',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    backgroundColor: colors.brand,
    paddingInline: '0.25rem',
    fontWeight: 500,
    fontSize: '10px',
    lineHeight: 1,
    color: '#fff',
  },
  menuButton: { display: { default: 'inline-flex', [media.lg]: 'none' } },
  icon: { height: '1.5rem', width: '1.5rem' },
  drawer: {
    position: 'fixed',
    left: 0,
    top: 0,
    margin: 0,
    height: '100dvh',
    maxHeight: 'none',
    width: 'calc(100% - 1.5rem)',
    maxWidth: '28rem',
    borderWidth: 0,
    backgroundColor: '#fff',
    padding: 0,
    boxShadow:
      '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transform: {
      default: 'translateX(-100%)',
      '[open]': {
        default: 'translateX(0)',
        '@starting-style': 'translateX(-100%)',
      },
    },
    transition: DRAWER_TRANSITION,
    '::backdrop': {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      opacity: { default: 0, '[open]': { default: 1, '@starting-style': 0 } },
      transition: BACKDROP_TRANSITION,
    },
  },
  drawerInner: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    paddingInline: '1.5rem',
    paddingBlock: '1.25rem',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerNav: { marginTop: '2rem' },
  drawerList: {
    display: 'flex',
    listStyle: 'none',
    flexDirection: 'column',
    rowGap: '1.5rem',
  },
  drawerLink: {
    borderRadius: '0.25rem',
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    color: {
      default: colors.ink,
      ':hover': { default: null, [media.hover]: colors.brand },
    },
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
});

export const Navbar = ({
  links = DEFAULT_LINKS,
  brandHref = '/',
  brandLabel = 'StyleNest home',
  cartHref = '/',
  cartLabel = 'Shopping bag',
  cartCount = 0,
}: TNavbarProps) => {
  const drawerId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

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
    <header {...stylex.props(styles.root)} data-print-hidden>
      <div {...stylex.props(styles.container)}>
        <div {...stylex.props(styles.leftCluster)}>
          <Link
            to={brandHref}
            {...stylex.props(styles.brand, focusRing.ring)}
            aria-label={brandLabel}
          >
            <StyleNestLogo
              {...stylex.props(styles.logo)}
              aria-label="StyleNest"
            />
          </Link>

          <nav {...stylex.props(styles.desktopNav)} aria-label="Main">
            <ul {...stylex.props(styles.navList)}>
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    params={link.params}
                    {...stylex.props(styles.link, focusRing.ring)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div {...stylex.props(styles.actions)}>
          <Link
            to={cartHref}
            {...stylex.props(styles.iconButton, focusRing.ring)}
            aria-label={cartAccessibleLabel(cartLabel, cartCount)}
          >
            <ShoppingBagIcon {...stylex.props(styles.icon)} />
            {cartCount > 0 && (
              <span {...stylex.props(styles.cartBadge)} aria-hidden="true">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            {...stylex.props(
              styles.iconButton,
              focusRing.ring,
              styles.menuButton,
            )}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={drawerId}
            onClick={openDrawer}
          >
            <MenuIcon {...stylex.props(styles.icon)} />
          </button>
        </div>
      </div>

      {!isDesktop && (
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- backdrop click-to-close; <dialog> handles Esc natively.
        <dialog
          id={drawerId}
          ref={dialogRef}
          data-navbar-drawer
          {...stylex.props(styles.drawer)}
          aria-label="Site menu"
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === dialogRef.current) closeDrawer();
          }}
        >
          <div {...stylex.props(styles.drawerInner)}>
            <div {...stylex.props(styles.drawerHeader)}>
              <StyleNestLogo
                {...stylex.props(styles.logo)}
                aria-label="StyleNest"
              />
              <button
                type="button"
                {...stylex.props(styles.iconButton, focusRing.ring)}
                aria-label="Close menu"
                onClick={closeDrawer}
              >
                <CloseIcon {...stylex.props(styles.icon)} />
              </button>
            </div>

            <nav {...stylex.props(styles.drawerNav)} aria-label="Mobile">
              <ul {...stylex.props(styles.drawerList)}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      params={link.params}
                      {...stylex.props(styles.drawerLink, focusRing.ring)}
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
