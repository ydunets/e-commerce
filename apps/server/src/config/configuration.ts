import { z } from 'zod';

const NodeEnv = {
  development: 'development',
  production: 'production',
  test: 'test',
} as const;

export const LogLevel = { debug: 'debug', info: 'info', warn: 'warn', error: 'error' } as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const DEFAULT_PORT = 3000;
const configurationSchema = z.object({
  POSTGRES_URL: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_SSLMODE: z.string().default('disable'),
  LOG_LEVEL: z.enum(LogLevel),
  NODE_ENV: z.enum(NodeEnv),
  HOST: z.string().default('localhost'),
  // Ajv rejects the empty string but accepts whitespace and non-finite numeric strings.
  // Preserve that environment contract; socket binding remains the server's responsibility.
  PORT: z
    .string()
    .refine((value) => value !== '' && !Number.isNaN(Number(value)), 'Expected a numeric value')
    .transform(Number)
    .default(DEFAULT_PORT),
  npm_package_version: z.string().optional(),
});

/** Parses supplied environment values without reading files or mutating the caller's environment. */
export function parseConfiguration(environment: Record<string, string | undefined>) {
  const result = configurationSchema.safeParse(environment);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid configuration: ${problems.join('; ')}`);
  }
  const env = result.data;
  return {
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === NodeEnv.development,
    isProduction: env.NODE_ENV === NodeEnv.production,
    version: env.npm_package_version ?? '0.0.0',
    log: { level: env.LOG_LEVEL },
    server: { host: env.HOST, port: env.PORT },
    db: {
      url: `postgres://${encodeURIComponent(env.POSTGRES_USER)}:${encodeURIComponent(env.POSTGRES_PASSWORD)}@${env.POSTGRES_URL}/${env.POSTGRES_DB}?sslmode=${env.POSTGRES_SSLMODE}`,
    },
  };
}
