import assert from 'node:assert/strict';
import type { ICustomWorld } from '../support/custom-world.ts';

export const STATUS_OK = 200;
export const PRODUCTS_URL = '/api/v1/products';

export async function getJson<T>(world: ICustomWorld, url: string): Promise<T> {
  const response = await world.server.inject({ method: 'GET', url });
  assert.equal(response.statusCode, STATUS_OK, `${url}: ${response.body}`);
  return response.json<T>();
}

export function assertKeys(value: object, keys: string[]): void {
  assert.deepEqual(Object.keys(value).sort(), keys.toSorted());
}

export function assertText(value: unknown): asserts value is string {
  assert.equal(typeof value, 'string');
  assert.ok((value as string).length > 0);
}
