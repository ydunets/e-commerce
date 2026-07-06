import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import { createApiProxy, sendResponse, toWebRequest } from './helpers.mjs';

const port = process.env.PORT ?? 3000;
const distDir = path.resolve(import.meta.dirname, '../dist');

const manifest = JSON.parse(
  fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf-8'),
);
const { js = [], css = [] } = manifest.entries.index.initial;
const assets = { js, css };

const { render } = await import(
  pathToFileURL(path.join(distDir, 'server/index.js')).href
);

const app = express();

// Forward API calls to the Fastify server (apps/server).
app.use('/api', createApiProxy(process.env.API_URL ?? 'http://localhost:4000'));

// Never expose the server bundle or the manifest.
app.use((req, res, next) => {
  if (req.path.startsWith('/server/') || req.path === '/manifest.json') {
    return res.status(404).end();
  }
  next();
});

app.use(express.static(distDir, { index: false }));

app.use(async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  try {
    const response = await render({ request: toWebRequest(req), assets });
    sendResponse(res, response);
  } catch (err) {
    next(err);
  }
});

app.listen(port, () => {
  console.log(`Production server running at http://localhost:${port}`);
});
