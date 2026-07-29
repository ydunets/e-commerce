import { expect, test } from '@rstest/core';
import {
  ApiError,
  apiErrorSerializationAdapter,
  isApiError,
  toApiError,
} from '@/shared/api';

const NOT_FOUND = new ApiError({
  statusCode: 404,
  message: 'Product voyager-hoodie not found',
  error: 'Not Found',
  correlationId: 'YevPQs',
});

test('toApiError reads the server error envelope', async () => {
  const response = new Response(
    JSON.stringify({
      statusCode: 409,
      message: 'Email already taken',
      error: 'Conflict',
      correlationId: 'abc123',
    }),
    { status: 409 },
  );

  const apiError = await toApiError(response);

  expect(isApiError(apiError)).toBe(true);
  expect(apiError.statusCode).toBe(409);
  expect(apiError.message).toBe('Email already taken');
  expect(apiError.correlationId).toBe('abc123');
});

test('toApiError falls back to the status line when the body is not JSON', async () => {
  const response = new Response('<html>Bad Gateway</html>', {
    status: 502,
    statusText: 'Bad Gateway',
  });

  const apiError = await toApiError(response);

  expect(apiError.statusCode).toBe(502);
  expect(apiError.message).toBe('Bad Gateway');
});

test('the serialization adapter round-trips an ApiError', () => {
  const {
    test: matches,
    toSerializable,
    fromSerializable,
  } = apiErrorSerializationAdapter;

  expect(matches(NOT_FOUND)).toBe(true);
  expect(matches(new Error('plain'))).toBe(false);

  const revived = fromSerializable(toSerializable(NOT_FOUND));

  expect(isApiError(revived)).toBe(true);
  expect(revived.statusCode).toBe(404);
  expect(revived.message).toBe('Product voyager-hoodie not found');
  expect(revived.correlationId).toBe('YevPQs');
});
