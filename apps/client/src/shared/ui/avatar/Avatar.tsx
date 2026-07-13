import { useState } from 'react';
import { squareImage } from '@/shared/lib/image';

export type TAvatarProps = {
  name: string;
  src?: string | null;
  size?: number;
};

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
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-tertiary"
      style={{ width: size, height: size }}
    >
      {src && showImage ? (
        <img
          src={squareImage(src, size * 2)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span
          className="font-medium leading-none"
          style={{ fontSize: Math.round(size * 0.4) }}
          aria-hidden="true"
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
};
