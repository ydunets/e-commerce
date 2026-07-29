import { useEffect, useState } from 'react';
import { probeServers, type ServerHealth } from '@/shared/api';

export type ServerOutage =
  | 'checking'
  | 'app-unreachable'
  | 'api-unavailable'
  | 'none';

// An unreachable app server also fails the api probe, so the app verdict has to
// win: only a live app server makes an api failure meaningful on its own.
function readOutage(health: ServerHealth): ServerOutage {
  if (!health.app) return 'app-unreachable';
  return health.api ? 'none' : 'api-unavailable';
}

export function useServerHealth(error: unknown): ServerOutage {
  const [outage, setOutage] = useState<ServerOutage>('checking');

  // biome-ignore lint/correctness/useExhaustiveDependencies: `error` is the hook's own argument, so a second failure on a mounted boundary has to re-probe; the rule reads it as an outer-scope value.
  useEffect(() => {
    const controller = new AbortController();
    setOutage('checking');

    probeServers(controller.signal).then((health) => {
      if (controller.signal.aborted) return;
      setOutage(readOutage(health));
    });

    return () => controller.abort();
  }, [error]);

  return outage;
}
