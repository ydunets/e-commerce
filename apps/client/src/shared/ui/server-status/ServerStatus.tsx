import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/shared/api';
import { cx } from '@/shared/lib/cx';

const STATUS_DOT = {
  pending: 'bg-amber-400 animate-pulse',
  error: 'bg-red-500',
  success: 'bg-green-500',
} as const;

const describeError = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export function ServerStatus() {
  const request = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cx(
            'inline-block h-2.5 w-2.5 rounded-full',
            STATUS_DOT[request.status],
          )}
        />
        <h2 className="text-sm font-semibold text-gray-700">
          Server connection
        </h2>
      </div>

      {request.status === 'pending' && (
        <p className="text-sm text-gray-500">Contacting the server…</p>
      )}

      {request.status === 'error' && (
        <p className="text-sm text-red-600">
          Could not reach the server: {describeError(request.error)}
        </p>
      )}

      {request.status === 'success' && (
        <div className="text-sm text-gray-600">
          <p>
            Connected — server reports{' '}
            <span className="font-semibold text-gray-900">
              {request.data.count}
            </span>{' '}
            user(s).
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
            {JSON.stringify(request.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
