import { z } from 'zod';

// Preserve the email grammar of the legacy Ajv full-format validator.
const SUBSCRIBER_EMAIL_PATTERN =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

export const subscribeBodySchema = z
  .object({
    email: z
      .preprocess(
        // Fastify's legacy coerceTypes: 'array' unwraps one-element arrays.
        (value) => (Array.isArray(value) && value.length === 1 ? value[0] : value),
        z.string().regex(SUBSCRIBER_EMAIL_PATTERN),
      )
      .describe('Visitor email address to subscribe to the newsletter'),
  })
  .meta({ required: ['email'] });

export type SubscribeBody = z.infer<typeof subscribeBodySchema>;
