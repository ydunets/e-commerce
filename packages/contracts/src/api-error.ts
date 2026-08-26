import { type Static, Type } from 'typebox';

export const apiErrorSubErrorSchema = Type.Object({
  path: Type.String({ example: '/email' }),
  message: Type.String({ example: 'must match format "email"' }),
});

export const apiErrorResponseSchema = Type.Object(
  {
    statusCode: Type.Number({ example: 400 }),
    message: Type.String({ example: 'Validation error' }),
    error: Type.String({ example: 'Bad Request' }),
    correlationId: Type.String({ example: 'YevPQs' }),
    subErrors: Type.Optional(
      Type.Array(apiErrorSubErrorSchema, {
        description: 'Field-level details for a validation failure',
      }),
    ),
    details: Type.Optional(
      Type.Unknown({
        description:
          'Machine-readable payload of a domain failure, e.g. an insufficient stock conflict',
      }),
    ),
  },
  { $id: 'ApiErrorResponse' },
);

export type ApiErrorSubError = Static<typeof apiErrorSubErrorSchema>;
export type ApiErrorResponse = Static<typeof apiErrorResponseSchema>;
