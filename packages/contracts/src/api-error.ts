import { z } from 'zod';

export const apiErrorSubErrorSchema = z.object({
  path: z.string().meta({ example: '/email' }),
  message: z.string().meta({ example: 'must match format "email"' }),
});

export const apiErrorResponseSchema = z
  .object({
    statusCode: z.number().meta({ example: 400 }),
    message: z.string().meta({ example: 'Validation error' }),
    error: z.string().meta({ example: 'Bad Request' }),
    correlationId: z.string().meta({ example: 'YevPQs' }),
    subErrors: z
      .array(apiErrorSubErrorSchema)
      .meta({
        description: 'Field-level details for a validation failure',
      })
      .optional(),
    details: z
      .unknown()
      .meta({
        description:
          'Machine-readable payload of a domain failure, e.g. an insufficient stock conflict',
      })
      .optional(),
  })
  .meta({ id: 'ApiErrorResponse', $id: 'ApiErrorResponse' });

export type ApiErrorSubError = z.infer<typeof apiErrorSubErrorSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
