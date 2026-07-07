import type { Product } from '@/entities/product';
import { squareImage } from '@/shared/lib/image';
import { Accordion } from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { ColorSwatches } from '@/shared/ui/color-swatches';
import { ImageGallery } from '@/shared/ui/image-gallery';
import { PriceTag } from '@/shared/ui/price-tag';
import { QuantityStepper } from '@/shared/ui/quantity-stepper';
import { SizeSelector } from '@/shared/ui/size-selector';
import { StarRating } from '@/shared/ui/star-rating';
import { colorPreviewImages, type DemoState } from '../lib/product-display';
import { useProductSelection } from '../lib/useProductSelection';
import styles from './ProductDetails.module.css';

export type TProductDetailsProps = {
  product: Product;
  demoState?: DemoState;
};

export const ProductDetails = ({
  product,
  demoState = 'default',
}: TProductDetailsProps) => {
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
  } = useProductSelection(product, demoState);

  return (
    <section className={styles.root} aria-label={product.name}>
      {/* Preload each colour's first image (hoisted to <head> by React) so switching colours is instant. */}
      {colorPreviewImages(product).map((url) => (
        <link key={url} rel="preload" as="image" href={squareImage(url, 800)} />
      ))}

      <div className={styles.layout}>
        <ImageGallery images={galleryImages} alt={product.name} />

        <div className={styles.info}>
          <h1 className={styles.title}>{product.name}</h1>

          {currentVariant && (
            <PriceTag
              salePrice={currentVariant.salePrice}
              listPrice={currentVariant.listPrice}
              discountPercentage={currentVariant.discountPercentage}
            />
          )}

          <StarRating
            rating={product.reviews.average}
            reviewCount={product.reviews.count}
          />

          <p className={styles.description}>{product.description}</p>

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

          <Button size="xl" className="w-full" disabled={isOutOfStock}>
            Add to Cart
          </Button>

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
    </section>
  );
};
