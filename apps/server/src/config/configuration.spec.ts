import assert from 'node:assert/strict';
import { it } from 'node:test';
import { parseConfiguration } from './configuration.js';

const REQUIRED_ENV = {
  POSTGRES_URL: 'database.example:5432',
  POSTGRES_USER: 'store user',
  POSTGRES_PASSWORD: 'pass/@word',
  POSTGRES_DB: 'store',
  NODE_ENV: 'test',
  LOG_LEVEL: 'error',
};

it('preserves the standalone configuration shape, defaults and encoded credentials', () => {
  assert.deepEqual(parseConfiguration(REQUIRED_ENV), {
    nodeEnv: 'test',
    isDevelopment: false,
    isProduction: false,
    version: '0.0.0',
    log: { level: 'error' },
    server: { host: 'localhost', port: 3000 },
    db: {
      url: 'postgres://store%20user:pass%2F%40word@database.example:5432/store?sslmode=disable',
    },
  });
});

it('matches the previous Ajv PORT conversion, including empty and non-finite strings', () => {
  // Expected results were compared directly with env-schema 7.0.0 before its removal.
  const accepted: [string | undefined, number][] = [
    [undefined, 3000],
    [' ', 0],
    ['3000', 3000],
    ['1.5', 1.5],
    ['0', 0],
    ['-1', -1],
    ['65536', 65_536],
    ['0x10', 16],
    ['1e3', 1000],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ];
  for (const [PORT, expected] of accepted) {
    assert.equal(parseConfiguration({ ...REQUIRED_ENV, PORT }).server.port, expected, String(PORT));
  }
  for (const PORT of ['', 'NaN', 'true', '1_000']) {
    assert.throws(() => parseConfiguration({ ...REQUIRED_ENV, PORT }), /PORT/, PORT);
  }
});

it('requires every database variable and both enums without disclosing supplied values', () => {
  for (const key of Object.keys(REQUIRED_ENV)) {
    const input: Record<string, string | undefined> = { ...REQUIRED_ENV };
    delete input[key];
    assert.throws(() => parseConfiguration(input), new RegExp(key));
  }
  const secret = 'synthetic-sensitive-value';
  assert.throws(
    () =>
      parseConfiguration({ ...REQUIRED_ENV, LOG_LEVEL: secret, NODE_ENV: secret, PORT: secret }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /LOG_LEVEL/);
      assert.match(error.message, /NODE_ENV/);
      assert.match(error.message, /PORT/);
      assert.doesNotMatch(error.stack ?? '', /synthetic-sensitive-value|pass\/@word|postgres:\/\//);
      return true;
    },
  );
});

it('preserves empty strings, explicit overrides and version fallback without mutating unrelated keys', () => {
  const input = Object.freeze({
    ...REQUIRED_ENV,
    POSTGRES_URL: '',
    POSTGRES_USER: '',
    POSTGRES_PASSWORD: '',
    POSTGRES_DB: '',
    POSTGRES_SSLMODE: '',
    HOST: '',
    npm_package_version: '',
    OTEL_SERVICE_NAME: 'retained-service',
  });
  const actual = parseConfiguration(input);
  assert.equal(actual.server.host, '');
  assert.equal(actual.version, '');
  assert.equal(actual.db.url, 'postgres://:@/?sslmode=');
  assert.equal(input.OTEL_SERVICE_NAME, 'retained-service');
  assert.equal(
    parseConfiguration({ ...REQUIRED_ENV, npm_package_version: '2.3.4' }).version,
    '2.3.4',
  );
  const configured = parseConfiguration({
    ...REQUIRED_ENV,
    HOST: '0.0.0.0',
    POSTGRES_SSLMODE: 'require',
    PORT: '8080',
  });
  assert.deepEqual(configured.server, { host: '0.0.0.0', port: 8080 });
  assert.ok(configured.db.url.endsWith('?sslmode=require'));
});

it('preserves each environment flag and permitted log level', () => {
  for (const NODE_ENV of ['development', 'production', 'test']) {
    for (const LOG_LEVEL of ['debug', 'info', 'warn', 'error']) {
      const actual = parseConfiguration({ ...REQUIRED_ENV, NODE_ENV, LOG_LEVEL });
      assert.equal(actual.nodeEnv, NODE_ENV);
      assert.equal(actual.isDevelopment, NODE_ENV === 'development');
      assert.equal(actual.isProduction, NODE_ENV === 'production');
      assert.equal(actual.log.level, LOG_LEVEL);
    }
  }
});
