import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { squareImage } from '@/shared/lib/image';
import { colors } from '@/shared/ui/tokens.stylex';

export type TAvatarProps = {
  name: string;
  src?: string | null;
  size?: number;
};

const styles = stylex.create({
  root: {
    display: 'inline-flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: '9999px',
    backgroundColor: colors.surface,
    color: colors.muted,
  },
  image: { height: '100%', width: '100%', objectFit: 'cover' },
  initials: { fontWeight: 500, lineHeight: 1 },
});

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export const Avatar = ({ name, src, size = 40 }: TAvatarProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <span {...stylex.props(styles.root)} style={{ width: size, height: size }}>
      {src && showImage ? (
        <img
          src={squareImage(src, size * 2)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          {...stylex.props(styles.image)}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span
          {...stylex.props(styles.initials)}
          style={{ fontSize: Math.round(size * 0.4) }}
          aria-hidden="true"
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
};
