/** Canonical clothing-size order shared by the API and the storefront. */
export const SIZE_RANK: Record<string, number> = { xs: 0, sm: 1, md: 2, lg: 3, xl: 4, xxl: 5 };

const NUMERIC_RANK_OFFSET = 100;
const UNKNOWN_RANK = 900;

function sizeRank(size: string): number {
  const known = SIZE_RANK[size];
  if (known !== undefined) return known;
  const numeric = Number(size);
  return Number.isNaN(numeric) ? UNKNOWN_RANK : NUMERIC_RANK_OFFSET + numeric;
}

/** Letter sizes first (xs..xxl), then numeric shoe sizes ascending, then anything else alphabetically. */
export function compareSizes(first: string, second: string): number {
  return sizeRank(first) - sizeRank(second) || first.localeCompare(second);
}
