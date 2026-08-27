export type Debounced<Args extends unknown[]> = {
  (...args: Args): void;
  cancel: () => void;
  flush: () => void;
};

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): Debounced<Args> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  const run = (...args: Args): void => {
    pendingArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      pendingArgs = null;
      fn(...args);
    }, delayMs);
  };

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      pendingArgs = null;
    }
  };

  const flush = (): void => {
    if (pendingArgs === null) {
      return;
    }
    const args = pendingArgs;
    cancel();
    fn(...args);
  };

  return Object.assign(run, { cancel, flush });
}
