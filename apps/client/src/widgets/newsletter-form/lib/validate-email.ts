import { z } from 'zod';
import { validate } from '@/shared/lib/validate';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Each `refine` aborts on failure so an empty value only ever reports the
// required message, never the format one too.
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
