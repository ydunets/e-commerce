interface SupabaseImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
}

const PUBLIC_OBJECT_PATH = '/storage/v1/object/public/';
const RENDER_IMAGE_PATH = '/storage/v1/render/image/public/';

// Width alone does NOT preserve aspect ratio here (height stays original) —
// pass both dimensions with a `resize` mode.
export function supabaseImage(
  url: string,
  { width, height, quality = 75, resize }: SupabaseImageOptions = {},
): string {
  if (!url.includes(PUBLIC_OBJECT_PATH)) return url;

  const rendered = url.replace(PUBLIC_OBJECT_PATH, RENDER_IMAGE_PATH);
  const params = new URLSearchParams({ quality: String(quality) });
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  if (resize) params.set('resize', resize);
  return `${rendered}?${params.toString()}`;
}

export function squareImage(url: string, size: number): string {
  return supabaseImage(url, { width: size, height: size, resize: 'cover' });
}
