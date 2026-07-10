import { useState } from 'react';
import type { Product } from '@/entities/product';
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
import { ProductReviewsDialog } from '@/widgets/product-reviews';
import { colorPreviewImages } from '../lib/product-display';
import { useProductSelection } from '../lib/useProductSelection';
import styles from './ProductDetails.module.css';

export type TProductDetailsProps = {
  product: Product;
};

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

  return (
    <section className={styles.root} aria-label={product.name}>
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

      <div className={styles.layout}>
        <ImageGallery images={galleryImages} alt={product.name} />

        <div className={styles.info}>
          <div className={styles.details}>
            <div className={styles.header}>
              <h1 className={styles.title}>{product.name}</h1>

              <div className={styles.meta}>
                {currentVariant && <PriceTag price={currentVariant.price} />}

                <StarRating
                  rating={product.reviews.average}
                  reviewCount={product.reviews.count}
                  onReviewsClick={() => setReviewsOpen(true)}
                />
              </div>
            </div>

            <p className={styles.description}>{product.description}</p>

            <div className={styles.options}>
              <div className={styles.field}>
                <span className={styles.label}>Available Colors</span>
                <ColorSwatches
                  options={colorOptions}
                  value={selectedColor}
                  onChange={selectColor}
                />
              </div>

              {sizeOptions.length > 0 && (
                <div className={styles.field}>
                  <span className={styles.label}>Available Sizes</span>
                  <SizeSelector
                    options={sizeOptions}
                    value={selectedSize}
                    onChange={selectSize}
                  />
                </div>
              )}

              <div className={styles.field}>
                <span className={styles.label}>Quantity</span>
                <QuantityStepper
                  value={displayedQuantity}
                  max={maxStock}
                  disabled={isOutOfStock}
                  onChange={setQuantity}
                />
              </div>

              {isOutOfStock && (
                <p className={styles.outOfStock}>
                  Sorry, this item is out of stock
                </p>
              )}
            </div>

            <Button size="xl" className="w-full" disabled={isOutOfStock}>
              Add to Cart
            </Button>
          </div>

          <div className={styles.accordions}>
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
