const SIZE_LABELS: Record<string, string> = {
  xs: 'XS',
  sm: 'S',
  md: 'M',
  lg: 'L',
  xl: 'XL',
  xxl: 'XXL',
};

export function sizeLabel(size: string): string {
  return SIZE_LABELS[size] ?? size.toUpperCase();
}
