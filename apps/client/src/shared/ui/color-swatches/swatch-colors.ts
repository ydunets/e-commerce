/**
 * Single source of truth for rendering a named product color as a swatch.
 *
 * Product data carries only color *names* (e.g. `product.colors = ['green', 'brown']`);
 * the mapping from a name to its rendered hex is presentation data and lives here,
 * not in CSS. `fill` is the swatch background; `ring` is the selected-state ring
 * (via `currentColor`) and defaults to `fill`, overridden for near-white fills so the
 * ring stays visible against the swatch.
 */
export type TSwatchColor = { fill: string; ring: string };

const SWATCH_COLORS: Record<string, TSwatchColor> = {
  green: { fill: '#2cc190', ring: '#2cc190' },
  brown: { fill: '#c8870c', ring: '#c8870c' },
  blue: { fill: '#3b82f6', ring: '#3b82f6' },
  white: { fill: '#f3f4f6', ring: '#d2d6db' },
  black: { fill: '#171717', ring: '#171717' },
  red: { fill: '#ef4444', ring: '#ef4444' },
  orange: { fill: '#f97316', ring: '#f97316' },
  yellow: { fill: '#facc15', ring: '#facc15' },
  pink: { fill: '#ec4899', ring: '#ec4899' },
  purple: { fill: '#a855f7', ring: '#a855f7' },
};

// Neutral fallback so an unknown color name renders a visible (rather than
// transparent) swatch. No design color depends on this path.
const FALLBACK: TSwatchColor = { fill: '#e5e5e5', ring: '#a3a3a3' };

export function resolveSwatchColor(value: string): TSwatchColor {
  return SWATCH_COLORS[value.toLowerCase()] ?? FALLBACK;
}
