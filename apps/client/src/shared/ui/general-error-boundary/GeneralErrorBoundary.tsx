import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import {
  type ErrorComponentProps,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import { type ReactNode, useEffect } from 'react';
import { type ApiError, isApiError } from '@/shared/api';
import { describeError } from '@/shared/lib/describeError';
import {
  type ServerOutage,
  useServerHealth,
} from '@/shared/lib/useServerHealth';
import { Button } from '@/shared/ui/button';
import { ERROR_SCREEN_LAYOUT, ErrorScreen } from '@/shared/ui/error-screen';

export type TStatusHandlerContext = {
  error: ApiError;
  params: Record<string, string | undefined>;
  retry: () => void;
};

export type TStatusHandler = (context: TStatusHandlerContext) => ReactNode;

type TRetryContext = { retry: () => void };

type TOutageScreen = (context: TRetryContext) => ReactNode;

export type TUnexpectedErrorHandler = (
  context: TRetryContext & { error: unknown },
) => ReactNode;

export type TGeneralErrorBoundaryProps = ErrorComponentProps & {
  className?: string;
  statusHandlers?: Record<number, TStatusHandler>;
  defaultStatusHandler?: TStatusHandler;
  unexpectedErrorHandler?: TUnexpectedErrorHandler;
};

const reloadPage = () => {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

const SubErrorList = ({ error }: { error: ApiError }) =>
  error.subErrors?.length ? (
    <ul className="mt-2 list-inside list-disc text-left text-sm text-danger">
      {error.subErrors.map((subError) => (
        <li key={`${subError.path}-${subError.message}`}>
          <span className="font-medium">{subError.path || 'request'}</span>{' '}
          {subError.message}
        </li>
      ))}
    </ul>
  ) : null;

const correlationFootnote = (error: ApiError) =>
  error.correlationId ? `Reference: ${error.correlationId}` : undefined;

const RetryButton = ({ retry }: { retry: () => void }) => (
  <Button variant="primary" onClick={retry}>
    Try again
  </Button>
);

const RefreshButton = () => (
  <Button variant="secondary" onClick={reloadPage}>
    Refresh the page
  </Button>
);

const defaultStatusHandlers: Record<number, TStatusHandler> = {
  400: ({ error, retry }) => (
    <ErrorScreen
      title="Bad request"
      description={
        <>
          {error.message}
          <SubErrorList error={error} />
        </>
      }
      action={<RetryButton retry={retry} />}
      footnote={correlationFootnote(error)}
    />
  ),
  401: () => (
    <ErrorScreen
      title="Unauthorized"
      description="You need to sign in before you can see this."
    />
  ),
  403: () => (
    <ErrorScreen
      title="Forbidden"
      description="You do not have permission to access this resource."
    />
  ),
  404: ({ error }) => (
    <ErrorScreen
      title="Not found"
      description="Sorry, we could not find what you were looking for."
      footnote={correlationFootnote(error)}
    />
  ),
  500: ({ error, retry }) => (
    <ErrorScreen
      title="Something went wrong on our end"
      description={error.message}
      action={<RetryButton retry={retry} />}
      footnote={correlationFootnote(error)}
    />
  ),
  502: () => (
    <ErrorScreen
      title="Bad gateway"
      description="We could not reach the store service. Please try again in a moment."
      action={<RefreshButton />}
    />
  ),
  503: () => (
    <ErrorScreen
      title="Service unavailable"
      description="The store is temporarily unavailable. Please try again in a moment."
      action={<RefreshButton />}
    />
  ),
};

const outageScreens: Partial<Record<ServerOutage, TOutageScreen>> = {
  'app-unreachable': () => (
    <ErrorScreen
      title="Cannot reach the app server"
      description="Your connection dropped, or the app server is not running."
      action={<RefreshButton />}
    />
  ),
  'api-unavailable': ({ retry }) => (
    <ErrorScreen
      title="The store service is unavailable"
      description="The app is running, but its API is not responding."
      action={<RetryButton retry={retry} />}
    />
  ),
};

const fallbackStatusScreen: TStatusHandler = ({ error, retry }) => (
  <ErrorScreen
    title={`Request failed (${error.statusCode})`}
    description={error.message}
    action={<RetryButton retry={retry} />}
    footnote={correlationFootnote(error)}
  />
);

const unexpectedErrorScreen: TUnexpectedErrorHandler = ({ error, retry }) => (
  <ErrorScreen
    title="Something went wrong"
    description={describeError(error)}
    action={<RetryButton retry={retry} />}
  />
);

export function GeneralErrorBoundary({
  error,
  reset,
  className = ERROR_SCREEN_LAYOUT,
  statusHandlers: givenStatusHandlers,
  defaultStatusHandler = fallbackStatusScreen,
  unexpectedErrorHandler = unexpectedErrorScreen,
}: TGeneralErrorBoundaryProps) {
  const router = useRouter();
  const params = useParams({ strict: false }) as Record<
    string,
    string | undefined
  >;
  const queryErrorReset = useQueryErrorResetBoundary();
  const outage = useServerHealth(error);

  useEffect(() => {
    queryErrorReset.reset();
  }, [queryErrorReset]);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = () => {
    queryErrorReset.reset();
    void router.invalidate().then(reset);
  };

  const statusHandlers = { ...defaultStatusHandlers, ...givenStatusHandlers };

  const renderError = () => {
    const outageScreen = outageScreens[outage];
    if (outageScreen) return outageScreen({ retry });
    if (!isApiError(error)) return unexpectedErrorHandler({ error, retry });

    const handler = statusHandlers[error.statusCode] ?? defaultStatusHandler;
    return handler({ error, params, retry });
  };

  return <div className={className}>{renderError()}</div>;
}
