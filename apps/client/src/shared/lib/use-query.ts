import { type DependencyList, useEffect, useState } from 'react';

export type QueryResult<T> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; data: T };

const INITIAL_STATE = { status: 'loading' } as const;

export function useQuery<T>(
  fn: () => Promise<T>,
  deps: DependencyList = [],
): QueryResult<T> {
  const [result, setResult] = useState<QueryResult<T>>(INITIAL_STATE);

  useEffect(() => {
    setResult(INITIAL_STATE);

    // Ignore a stale request that resolves after a newer one started.
    let active = true;

    fn()
      .then((data) => {
        if (active) setResult({ status: 'success', data });
      })
      .catch((error) => {
        if (active) setResult({ status: 'error', error });
      });

    return () => {
      active = false;
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: the hook forwards the caller-supplied dependency list by design.
  }, deps);

  return result;
}
