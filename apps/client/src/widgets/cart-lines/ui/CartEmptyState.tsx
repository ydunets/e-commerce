import { Button } from '@/shared/ui/button';
import styles from './CartEmptyState.module.css';

const EMPTY_CART_IMAGE_URL = '/images/cart/empty-cart.jpg';

const CartIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className={styles.icon}
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
    className={styles.arrow}
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
  <div className={styles.root}>
    <div className={styles.message}>
      <span className={styles.iconBadge}>
        <CartIcon />
      </span>
      <h2 className={styles.title}>Your cart is empty</h2>
      <p className={styles.subtitle}>Let's go explore some products</p>
      <Button href="/products">
        Explore products
        <ArrowRightIcon />
      </Button>
    </div>
    <img src={EMPTY_CART_IMAGE_URL} alt="" className={styles.image} />
  </div>
);
