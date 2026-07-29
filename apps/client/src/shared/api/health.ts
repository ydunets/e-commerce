const PROBE_TIMEOUT_MS = 3000;

export type ServerTier = 'app' | 'api';

// `/healthz` is served by the express SSR process itself; `/api/health` is
// rewritten by the proxy onto the Fastify `/health` route, which pings the DB.
const PROBE_PATHS: Record<ServerTier, string> = {
  app: '/healthz',
  api: '/api/health',
};

async function probe(path: string, signal: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(path, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(PROBE_TIMEOUT_MS)]),
      headers: { Accept: 'application/json' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type ServerHealth = Record<ServerTier, boolean>;

export async function probeServers(signal: AbortSignal): Promise<ServerHealth> {
  const [app, api] = await Promise.all([
    probe(PROBE_PATHS.app, signal),
    probe(PROBE_PATHS.api, signal),
  ]);

  return { app, api };
}
