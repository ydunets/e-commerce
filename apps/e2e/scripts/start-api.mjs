import { execSync, spawn } from 'node:child_process';
import path from 'node:path';

// Playwright launches webServer commands BEFORE globalSetup runs, so the
// database must be provisioned here, in the API's own startup chain —
// otherwise readiness polling deadlocks waiting for an API that has no DB.
const serverDir = path.resolve(import.meta.dirname, '../../server');

execSync('docker compose up -d --wait postgres', {
  cwd: serverDir,
  stdio: 'inherit',
});

const api = spawn('pnpm', ['start'], { cwd: serverDir, stdio: 'inherit' });

api.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => api.kill('SIGTERM'));
}
