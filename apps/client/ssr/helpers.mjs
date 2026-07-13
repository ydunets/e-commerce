import { Readable } from 'node:stream';

/** Convert an Express request to a Web API Request. */
export function toWebRequest(req) {
  const origin = `http://${req.headers.host ?? 'localhost'}`;
  const url = new URL(req.originalUrl ?? req.url, origin);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (value != null) {
      headers.set(key, value);
    }
  }

  return new Request(url, { method: req.method, headers });
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

/** Forward /api/* requests to the Fastify server. */
export function createApiProxy(apiUrl) {
  const baseUrl = new URL(apiUrl);

  return async (req, res, next) => {
    try {
      const target = new URL(req.originalUrl ?? req.url, baseUrl);
      if (target.origin !== baseUrl.origin) {
        res.statusCode = 400;
        res.end('Forbidden target origin');
        return;
      }

      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (HOP_BY_HOP_HEADERS.has(key)) continue;
        if (Array.isArray(value)) {
          for (const item of value) headers.append(key, item);
        } else if (value != null) {
          headers.set(key, value);
        }
      }

      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const response = await fetch(target, {
        method: req.method,
        headers,
        body: hasBody ? Readable.toWeb(req) : undefined,
        duplex: hasBody ? 'half' : undefined,
        redirect: 'manual',
      });

      sendResponse(res, response);
    } catch (err) {
      next(err);
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
