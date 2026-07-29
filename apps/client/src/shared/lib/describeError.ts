export const describeError = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';
