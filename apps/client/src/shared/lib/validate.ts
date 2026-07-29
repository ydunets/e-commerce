import type { ZodType } from 'zod';

/** Runs a Zod schema and returns the first issue's message, or null when valid. */
export function validate<T>(schema: ZodType<T>, value: unknown): string | null {
  const result = schema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? null);
}
