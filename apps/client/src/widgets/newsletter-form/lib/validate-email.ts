import { z } from 'zod';
import { validate } from '@/shared/lib/validate';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The first refine's `abort` is load-bearing: it stops the format check from
// also running on an empty value, which would otherwise report both issues.
// The second carries `abort` too, so a future third check doesn't have to
// reason about it.
const emailSchema = z
  .string()
  .refine((value) => value.trim().length > 0, {
    error: 'Email address is required.',
    abort: true,
  })
  .refine((value) => EMAIL_PATTERN.test(value), {
    error: 'Please enter a valid email address.',
    abort: true,
  });

export function validateEmail(email: string): string | null {
  return validate(emailSchema, email);
}
