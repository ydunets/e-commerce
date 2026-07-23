declare namespace NodeJS {
  interface ProcessEnv {
    /** Set by CI providers; switches Playwright to CI-safe settings. */
    CI?: string;
    /** Artificial delay (ms) for the specifications endpoint in streaming tests. */
    E2E_SPECS_DELAY_MS?: string;
  }
}
