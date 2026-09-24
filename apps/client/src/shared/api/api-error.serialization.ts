import { createSerializationAdapter } from '@tanstack/react-router';
import { ApiError, isApiError, type TApiErrorInit } from './api-error';

type TSerializedApiError = Omit<TApiErrorInit, 'details'> & {
  details?: string;
};

// Router-core's ShallowErrorPlugin reduces every Error to `new Error(message)`
// when the dehydrated match crosses to the client, which would strip the status
// off every loader failure raised during SSR. Adapters are tested ahead of the
// default plugins, so this keeps ApiError intact through hydration.
export const apiErrorSerializationAdapter = createSerializationAdapter({
  key: 'ApiError',
  test: isApiError,
  toSerializable: (apiError: ApiError): TSerializedApiError => ({
    statusCode: apiError.statusCode,
    message: apiError.message,
    error: apiError.error,
    correlationId: apiError.correlationId,
    subErrors: apiError.subErrors,
    details:
      apiError.details === undefined
        ? undefined
        : JSON.stringify(apiError.details),
  }),
  fromSerializable: (init: TSerializedApiError) =>
    new ApiError({
      ...init,
      details:
        init.details === undefined ? undefined : JSON.parse(init.details),
    }),
});
