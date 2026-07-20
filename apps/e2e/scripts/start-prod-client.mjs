import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';

// Streaming tests need the specifications request to be observably slower
// than the shell, otherwise a fast local API resolves the deferred data
// before the first flush and the tests cannot tell streaming from
// slow-but-buffered rendering. This proxy sits between the prod SSR server
// and the API and delays only the specifications endpoint.
const API_TARGET = process.env.API_URL ?? 'http://localhost:4000';
const API_ORIGIN = new URL(API_TARGET).origin;
const PROXY_PORT = 4600;
const CLIENT_PORT = process.env.PORT ?? '4173';
const SPECS_DELAY_MS = Number(process.env.E2E_SPECS_DELAY_MS ?? 800);

const STRIPPED_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const proxy = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/v1/specifications')) {
    await sleep(SPECS_DELAY_MS);
  }
  const target = URL.parse(req.url, API_TARGET);
  if (target === null || target.origin !== API_ORIGIN) {
    res.statusCode = 400;
    res.end();
    return;
  }
  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: { accept: req.headers.accept ?? '*/*' },
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    const headers = {};
    for (const [name, value] of upstream.headers) {
      if (!STRIPPED_HEADERS.has(name)) {
        headers[name] = value;
      }
    }
    res.writeHead(upstream.status, headers);
    res.end(body);
  } catch {
    res.statusCode = 502;
    res.end();
  }
});
proxy.listen(PROXY_PORT);

const clientDir = path.resolve(import.meta.dirname, '../../client');
const client = spawn('pnpm', ['preview'], {
  cwd: clientDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: CLIENT_PORT,
    API_URL: `http://localhost:${PROXY_PORT}`,
  },
});

client.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => client.kill('SIGTERM'));
}
