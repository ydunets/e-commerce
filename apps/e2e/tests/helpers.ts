import { expect, type Page } from '@playwright/test';

export const PRODUCT = {
  name: 'Voyager Hoodie',
  path: '/products/voyager-hoodie',
} as const;

export const ROUTES = {
  home: '/',
  about: '/about',
  products: '/products',
} as const;

/**
 * Navigate and wait until React has hydrated. The root layout sets
 * `data-hydrated` on <html> from a post-hydration effect; interacting
 * before that point silently drops events on server-rendered markup.
 */
export async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator('html[data-hydrated="true"]')).toBeAttached();
}
