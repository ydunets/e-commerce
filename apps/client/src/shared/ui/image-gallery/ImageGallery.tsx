import { useState } from 'react';
import { cx } from '@/shared/lib/cx';
import { squareImage } from '@/shared/lib/image';
import styles from './ImageGallery.module.css';

export type TImageGalleryProps = {
  images: string[];
  alt: string;
};

const MAIN_WIDTH = 800;
const THUMB_WIDTH = 200;

const MAX_FILLED_THUMBS = 3;

export const ImageGallery = ({ images, alt }: TImageGalleryProps) => {
  // Selection tracked by URL: when the image set changes (colour switch) the old
  // URL drops out, so the main image derives back to the first — no reset needed.
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const mainImage =
    activeUrl && images.includes(activeUrl) ? activeUrl : images[0];
  // Up to 3 thumbnails stretch to fill the row; beyond that they hold a fixed
  // width and the row scrolls, per the Figma "more than 3 thumbnails" variant.
  const isScrollable = images.length > MAX_FILLED_THUMBS;

  return (
    <div className={styles.root}>
      <div className={styles.mainWrap}>
        {mainImage && (
          <img
            src={squareImage(mainImage, MAIN_WIDTH)}
            alt={alt}
            className={styles.main}
            decoding="async"
          />
        )}
      </div>

      {images.length > 1 && (
        <div
          className={cx(styles.thumbs, isScrollable && styles.thumbsScroll)}
        >
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              className={cx(
                styles.thumb,
                isScrollable ? styles.thumbFixed : styles.thumbFill,
                url === mainImage && styles.thumbActive,
              )}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={url === mainImage}
              onClick={() => setActiveUrl(url)}
            >
              <img
                src={squareImage(url, THUMB_WIDTH)}
                alt=""
                className={styles.thumbImage}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
