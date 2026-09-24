import * as stylex from '@stylexjs/stylex';
import { media } from '@/shared/lib/breakpoints.stylex';
import { Button } from '@/shared/ui/button';
import { colors, shadows } from '@/shared/ui/tokens.stylex';

const EMPTY_CART_IMAGE_URL = '/images/cart/empty-cart.jpg';

const styles = stylex.create({
  root: {
    display: { default: 'flex', [media.lg]: 'grid' },
    flexDirection: 'column',
    gap: '2rem',
    gridTemplateColumns: { default: null, [media.lg]: '5fr 7fr' },
    alignItems: { default: null, [media.lg]: 'center' },
  },
  message: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    textAlign: 'center',
  },
  iconBadge: {
    marginBottom: '0.75rem',
    display: 'flex',
    height: '3rem',
    width: '3rem',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    backgroundColor: '#fff',
    color: colors.brand,
    boxShadow: shadows.card,
  },
  icon: { height: '1.5rem', width: '1.5rem' },
  arrow: { height: '1rem', width: '1rem' },
  title: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    fontWeight: 600,
    color: colors.ink,
  },
  subtitle: {
    marginBottom: '0.75rem',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: colors.muted,
  },
  image: {
    height: { default: '180px', [media.md]: '320px', [media.lg]: '432px' },
    width: '100%',
    borderRadius: '0.5rem',
    objectFit: 'cover',
  },
});

const CartIcon = () => (
  <svg
    viewBox="0 0 24 24"
    {...stylex.props(styles.icon)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.76L21 8H7" />
    <circle cx="10" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    {...stylex.props(styles.arrow)}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 12h16M13 5l7 7-7 7" />
  </svg>
);

export const CartEmptyState = () => (
  <div {...stylex.props(styles.root)}>
    <div {...stylex.props(styles.message)}>
      <span {...stylex.props(styles.iconBadge)}>
        <CartIcon />
      </span>
      <h2 {...stylex.props(styles.title)}>Your cart is empty</h2>
      <p {...stylex.props(styles.subtitle)}>Let's go explore some products</p>
      <Button href="/products">
        Explore products
        <ArrowRightIcon />
      </Button>
    </div>
    <img src={EMPTY_CART_IMAGE_URL} alt="" {...stylex.props(styles.image)} />
  </div>
);
