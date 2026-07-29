import { createSerializationAdapter } from '@tanstack/react-router';
import { ApiError, isApiError, type TApiErrorInit } from './api-error';

// Router-core's ShallowErrorPlugin reduces every Error to `new Error(message)`
// when the dehydrated match crosses to the client, which would strip the status
// off every loader failure raised during SSR. Adapters are tested ahead of the
// default plugins, so this keeps ApiError intact through hydration.
export const apiErrorSerializationAdapter = createSerializationAdapter({
  key: 'ApiError',
  test: isApiError,
  toSerializable: (apiError: ApiError): TApiErrorInit => ({
    statusCode: apiError.statusCode,
    message: apiError.message,
    error: apiError.error,
    correlationId: apiError.correlationId,
    subErrors: apiError.subErrors,
  }),
  fromSerializable: (init: TApiErrorInit) => new ApiError(init),
});
