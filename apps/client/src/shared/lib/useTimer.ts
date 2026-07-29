import { useEffect, useEffectEvent } from 'react';

/**
 * Runs `onElapsed` once after `delayMs`. Pass `null` for `delayMs` to leave
 * the timer stopped. Restarts whenever `delayMs` or `resetKey` changes.
 */
export function useTimer(
  onElapsed: () => void,
  delayMs: number | null,
  resetKey: unknown,
): void {
  const handleElapsed = useEffectEvent(onElapsed);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `resetKey` isn't read in the body; it's a caller-chosen value whose identity changing is what should restart the timer.
  useEffect(() => {
    if (delayMs === null) return;
    const timer = setTimeout(handleElapsed, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, resetKey]);
}
