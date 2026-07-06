import path from 'node:path';
import { createRsbuild, loadConfig } from '@rsbuild/core';
import express from 'express';
import {
  createApiProxy,
  extractAssets,
  sendResponse,
  toWebRequest,
} from './helpers.mjs';

// Resolve the app root from this file so the server works from any cwd.
const appRoot = path.resolve(import.meta.dirname, '..');
const { content } = await loadConfig({ cwd: appRoot });
const port = Number(process.env.PORT) || content.server?.port || 3000;

const rsbuild = await createRsbuild({
  cwd: appRoot,
  config: {
    ...content,
    server: {
      ...content.server,
      port,
      middlewareMode: true,
    },
  },
});

const devServer = await rsbuild.createDevServer();
const app = express();

// Forward API calls to the Fastify server (apps/server).
app.use('/api', createApiProxy(process.env.API_URL ?? 'http://localhost:4000'));

// SSR for page navigations; asset requests fall through to Rsbuild.
app.use(async (req, res, next) => {
  if (req.method !== 'GET' || req.path.includes('.')) {
    return next();
  }

  try {
    const bundle = await devServer.environments.node.loadBundle('index');
    const html = await devServer.environments.web.getTransformedHtml('index');

    const response = await bundle.render({
      request: toWebRequest(req),
      assets: extractAssets(html),
    });

    sendResponse(res, response);
  } catch (err) {
    next(err);
  }
});

app.use(devServer.middlewares);

const server = app.listen(port, async () => {
  await devServer.afterListen();
  console.log(`Dev server running at http://localhost:${port}`);
});

devServer.connectWebSocket({ server });
