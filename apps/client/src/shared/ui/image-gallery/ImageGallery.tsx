import * as stylex from '@stylexjs/stylex';
import { useRef, useState } from 'react';
import { squareImage } from '@/shared/lib/image';
import { focusRing } from '@/shared/ui/focus-ring';
import { transitions } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';

type TDragState = {
  active: boolean;
  startX: number;
  deltaX: number;
};

export type TImageGalleryProps = {
  images: string[];
  alt: string;
};

const MAIN_WIDTH = 800;
const MAIN_WIDTHS = [400, 800, 1200];
const THUMB_WIDTH = 200;

const MAX_FILLED_THUMBS = 3;
const SWIPE_THRESHOLD_PX = 50;

export const MAIN_IMAGE_SIZES = '(min-width: 768px) 592px, 100vw';

const styles = stylex.create({
  root: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '592px',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  mainWrap: {
    aspectRatio: '592 / 800',
    width: '100%',
    touchAction: 'pan-y',
    overflow: 'hidden',
    borderRadius: '0.5rem',
    backgroundColor: colors.surface,
  },
  main: { height: '100%', width: '100%', objectFit: 'cover' },
  thumbs: {
    display: 'flex',
    aspectRatio: '592 / 190',
    width: '100%',
    gap: '1rem',
  },
  thumbsScroll: {
    overflowX: 'auto',
    paddingBottom: '0.25rem',
    scrollbarWidth: 'none',
    // oxlint-disable-next-line @stylexjs/valid-styles -- the compiler emits the vendor pseudo-element, and WebKit still draws the scrollbar without it.
    '::-webkit-scrollbar': { display: 'none' },
  },
  thumb: {
    height: '100%',
    flexShrink: 0,
    cursor: 'pointer',
    overflow: 'hidden',
    borderRadius: '0.5rem',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    transitionProperty: transitions.colors,
    transitionDuration: transitions.duration,
    transitionTimingFunction: transitions.easing,
  },
  thumbFill: { flexGrow: 1, flexShrink: 1, flexBasis: '0%' },
  thumbFixed: { width: '160px' },
  thumbActive: { borderColor: colors.brandSolid },
  thumbImage: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.surface,
    objectFit: 'cover',
  },
});

export const mainImageSrcSet = (url: string): string =>
  MAIN_WIDTHS.map((width) => `${squareImage(url, width)} ${width}w`).join(', ');

export const ImageGallery = ({ images, alt }: TImageGalleryProps) => {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const mainImage =
    activeUrl && images.includes(activeUrl) ? activeUrl : images[0];
  const isScrollable = images.length > MAX_FILLED_THUMBS;

  const dragRef = useRef<TDragState>({ active: false, startX: 0, deltaX: 0 });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { active: true, startX: event.clientX, deltaX: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.deltaX = event.clientX - dragRef.current.startX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const { deltaX } = dragRef.current;
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || !mainImage) return;
    const currentIndex = images.indexOf(mainImage);
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const nextImage = images[nextIndex];
    if (nextImage) setActiveUrl(nextImage);
  };

  return (
    <div {...stylex.props(styles.root)}>
      <div
        {...stylex.props(styles.mainWrap)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {mainImage && (
          <img
            src={squareImage(mainImage, MAIN_WIDTH)}
            srcSet={mainImageSrcSet(mainImage)}
            sizes={MAIN_IMAGE_SIZES}
            alt={alt}
            width={MAIN_WIDTH}
            height={MAIN_WIDTH}
            {...stylex.props(styles.main)}
            fetchPriority="high"
            decoding="async"
            draggable={false}
          />
        )}
      </div>

      {images.length > 1 && (
        <div
          {...stylex.props(styles.thumbs, isScrollable && styles.thumbsScroll)}
        >
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              {...stylex.props(
                styles.thumb,
                focusRing.ring,
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
                {...stylex.props(styles.thumbImage)}
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
