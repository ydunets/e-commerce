import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { useAddToCart } from '@/entities/cart';
import type { Product } from '@/entities/product';
import { media } from '@/shared/lib/breakpoints.stylex';
import { Accordion } from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { ColorSwatches } from '@/shared/ui/color-swatches';
import {
  ImageGallery,
  MAIN_IMAGE_SIZES,
  mainImageSrcSet,
} from '@/shared/ui/image-gallery';
import { PriceTag } from '@/shared/ui/price-tag';
import { QuantityStepper } from '@/shared/ui/quantity-stepper';
import { SizeSelector } from '@/shared/ui/size-selector';
import { StarRating } from '@/shared/ui/star-rating';
import { colors } from '@/shared/ui/tokens.stylex';
import { ProductReviewsDialog } from '@/widgets/product-reviews';
import { colorPreviewImages } from '../lib/product-display';
import { useProductSelection } from '../lib/useProductSelection';

export type TProductDetailsProps = {
  product: Product;
};

const styles = stylex.create({
  // Page-level padding of the Figma storefront sections (5-6578 Desktop 96px,
  // 5-6592 Tablet 16px/64px, 5-6606 Mobile 16px/48px), which is what puts this
  // section's content box on the same margins as the two sections below it.
  root: {
    width: '100%',
    paddingInline: { default: '1rem', [media.lg]: '6rem' },
    paddingBlock: { default: '3rem', [media.md]: '4rem', [media.lg]: '6rem' },
  },
  // Figma: gallery/info sit 48px apart when stacked, 32px apart side-by-side.
  layout: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(1, minmax(0, 1fr))',
      [media.lg]: 'repeat(2, minmax(0, 1fr))',
    },
    gap: { default: '3rem', [media.lg]: '2rem' },
  },
  // Info column vertical rhythm mirrors the Figma frame:
  // 40px between the details block and the accordions.
  info: { display: 'flex', flexDirection: 'column', gap: '2.5rem' },
  // 32px between header, description, options and the Add to Cart button.
  details: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  // 20px between the title and the price/rating meta.
  header: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  // 12px between the price block and the rating row.
  meta: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  title: {
    fontSize: { default: '1.875rem', [media.lg]: '3rem' },
    lineHeight: { default: 1.25, [media.lg]: 1 },
    fontWeight: 600,
    color: colors.ink,
  },
  description: { fontSize: '1rem', lineHeight: '1.5rem', color: colors.muted },
  // 32px between the colour, size and quantity fields.
  options: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  // 16px between a field label and its control.
  field: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: colors.tertiary,
  },
  outOfStock: {
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontWeight: 600,
    color: colors.ink,
  },
  addToCart: { width: '100%' },
  cartError: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: colors.danger,
  },
  // 32px between accordion sections.
  accordions: { display: 'flex', flexDirection: 'column', gap: '2rem' },
});

export const ProductDetails = ({ product }: TProductDetailsProps) => {
  const {
    selectedColor,
    selectedSize,
    currentVariant,
    colorOptions,
    sizeOptions,
    galleryImages,
    isOutOfStock,
    maxStock,
    displayedQuantity,
    selectColor,
    selectSize,
    setQuantity,
  } = useProductSelection(product);

  const [reviewsOpen, setReviewsOpen] = useState(false);

  const addToCart = useAddToCart();
  const handleAddToCart = () => {
    if (!currentVariant) return;
    addToCart.mutate({ sku: currentVariant.sku, quantity: displayedQuantity });
  };

  return (
    <section {...stylex.props(styles.root)} aria-label={product.name}>
      {/* Preload each colour's first image (hoisted to <head> by React) so switching colours is instant. */}
      {colorPreviewImages(product).map((url) => (
        <link
          key={url}
          rel="preload"
          as="image"
          imageSrcSet={mainImageSrcSet(url)}
          imageSizes={MAIN_IMAGE_SIZES}
        />
      ))}

      <div {...stylex.props(styles.layout)}>
        <ImageGallery images={galleryImages} alt={product.name} />

        <div {...stylex.props(styles.info)}>
          <div {...stylex.props(styles.details)}>
            <div {...stylex.props(styles.header)}>
              <h1 {...stylex.props(styles.title)}>{product.name}</h1>

              <div {...stylex.props(styles.meta)}>
                {currentVariant && <PriceTag price={currentVariant.price} />}

                <StarRating
                  rating={product.reviews.average}
                  reviewCount={product.reviews.count}
                  onReviewsClick={() => setReviewsOpen(true)}
                />
              </div>
            </div>

            <p {...stylex.props(styles.description)}>{product.description}</p>

            <div {...stylex.props(styles.options)}>
              <div {...stylex.props(styles.field)}>
                <span {...stylex.props(styles.label)}>Available Colors</span>
                <ColorSwatches
                  options={colorOptions}
                  value={selectedColor}
                  onChange={selectColor}
                />
              </div>

              {sizeOptions.length > 0 && (
                <div {...stylex.props(styles.field)}>
                  <span {...stylex.props(styles.label)}>Available Sizes</span>
                  <SizeSelector
                    options={sizeOptions}
                    value={selectedSize}
                    onChange={selectSize}
                  />
                </div>
              )}

              <div {...stylex.props(styles.field)}>
                <span {...stylex.props(styles.label)}>Quantity</span>
                <QuantityStepper
                  value={displayedQuantity}
                  max={maxStock}
                  disabled={isOutOfStock}
                  onChange={setQuantity}
                />
              </div>

              {isOutOfStock && (
                <p {...stylex.props(styles.outOfStock)}>
                  Sorry, this item is out of stock
                </p>
              )}
            </div>

            <Button
              size="xl"
              style={styles.addToCart}
              disabled={isOutOfStock || addToCart.isPending}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>

            {addToCart.isError && (
              <p {...stylex.props(styles.cartError)} role="alert">
                Couldn't add to cart. Please try again.
              </p>
            )}
          </div>

          <div {...stylex.props(styles.accordions)}>
            {product.info.map((section) => (
              <Accordion
                key={section.title}
                title={section.title}
                items={section.description}
              />
            ))}
          </div>
        </div>
      </div>

      <ProductReviewsDialog
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        productId={product.id}
        productName={product.name}
      />
    </section>
  );
};
