declare namespace NodeJS {
  interface ProcessEnv {
    /** Set to 'true' to skip OpenTelemetry SDK startup. */
    OTEL_SDK_DISABLED?: string;
    /** Package version injected by pnpm/npm when running scripts. */
    npm_package_version?: string;
  }
}
