import { Readable } from 'node:stream';

/** Copy Node request headers into a Web API Headers object. */
function toHeaders(nodeHeaders, { skip } = {}) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (skip?.has(key)) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (value != null) {
      headers.set(key, value);
    }
  }
  return headers;
}

/** Convert an Express request to a Web API Request. */
export function toWebRequest(req) {
  const origin = `http://${req.headers.host ?? 'localhost'}`;
  const url = new URL(req.originalUrl ?? req.url, origin);

  return new Request(url, {
    method: req.method,
    headers: toHeaders(req.headers),
  });
}

/** Pipe a Web API Response into an Express response. */
export function sendResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (response.body) {
    Readable.fromWeb(response.body).pipe(res);
  } else {
    res.end();
  }
}

const HOP_BY_HOP_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  // Ask the API for an uncompressed body: fetch would decompress it anyway,
  // and forwarding a stale content-encoding header corrupts the response.
  'accept-encoding',
]);

// Fastify keeps its health route outside the /api prefix, and the Docker
// health check, the type-generation script and the Azure runbook all probe it
// there. Rewriting here gives the browser a same-origin path to the API's own
// health check without moving the route or duplicating the DB ping.
const PATH_REWRITES = new Map([['/api/health', '/health']]);

/** Answer the browser's app-tier health probe. */
export function healthz(_req, res) {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ status: 'ok' }));
}

/** Forward /api/* requests to the Fastify server. */
export function createApiProxy(apiUrl) {
  const baseUrl = new URL(apiUrl);

  return async (req, res) => {
    try {
      // Only a path is accepted: absolute and protocol-relative URLs could
      // redirect the proxy to another host.
      const rawUrl = req.originalUrl ?? req.url;
      if (!rawUrl.startsWith('/') || rawUrl.startsWith('//')) {
        res.statusCode = 400;
        res.end('Forbidden target origin');
        return;
      }

      const queryIndex = rawUrl.indexOf('?');
      const pathname = queryIndex === -1 ? rawUrl : rawUrl.slice(0, queryIndex);
      const target = new URL(baseUrl);
      target.pathname = PATH_REWRITES.get(pathname) ?? pathname;
      target.search = queryIndex === -1 ? '' : rawUrl.slice(queryIndex);

      const headers = toHeaders(req.headers, { skip: HOP_BY_HOP_HEADERS });

      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const response = await fetch(target, {
        method: req.method,
        headers,
        body: hasBody ? Readable.toWeb(req) : undefined,
        duplex: hasBody ? 'half' : undefined,
        redirect: 'manual',
      });

      sendResponse(res, response);
    } catch {
      // An unreachable upstream is a gateway failure, not an error inside this
      // server, and the client parses this envelope into an ApiError.
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          statusCode: 502,
          message: 'The store service is unreachable.',
          error: 'Bad Gateway',
        }),
      );
    }
  };
}

/** Extract client script/style URLs from Rsbuild's generated HTML. */
export function extractAssets(html) {
  const js = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const css = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/g)].map(
    (m) => m[1],
  );
  return { js, css };
}
