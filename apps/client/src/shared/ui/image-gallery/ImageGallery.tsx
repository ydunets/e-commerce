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

export const ImageGallery = ({ images, alt }: TImageGalleryProps) => {
  // Selection tracked by URL: when the image set changes (colour switch) the old
  // URL drops out, so the main image derives back to the first — no reset needed.
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const mainImage =
    activeUrl && images.includes(activeUrl) ? activeUrl : images[0];

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
        <div className={styles.thumbs}>
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              className={cx(
                styles.thumb,
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
