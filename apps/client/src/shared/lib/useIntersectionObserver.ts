import { useEffect, useEffectEvent, useState } from 'react';

export type UseIntersectionObserverOptions = {
  root?: Element | Document | null;
  rootMargin?: string;
  /* Arrays must be referentially stable (module-level or memoized). */
  threshold?: number | number[];
  initialIsIntersecting?: boolean;
  freezeOnceVisible?: boolean;
  onChange?: (
    isIntersecting: boolean,
    entry: IntersectionObserverEntry,
  ) => void;
};

export type UseIntersectionObserverReturn = {
  ref: (node: Element | null) => void;
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
};

export function useIntersectionObserver({
  root = null,
  rootMargin = '0%',
  threshold = 0,
  initialIsIntersecting = false,
  freezeOnceVisible = false,
  onChange,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn {
  const [target, setTarget] = useState<Element | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);

  const handleChange = useEffectEvent(
    (intersecting: boolean, observerEntry: IntersectionObserverEntry) => {
      setIsIntersecting(intersecting);
      setEntry(observerEntry);
      onChange?.(intersecting, observerEntry);
    },
  );

  const frozen = freezeOnceVisible && isIntersecting;

  useEffect(() => {
    if (!target || frozen) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const observerEntry of entries) {
          /* isIntersecting can be true below the highest requested threshold;
             refine it so consumers only see "visible enough". */
          const intersecting =
            observerEntry.isIntersecting &&
            observer.thresholds.some(
              (t) => observerEntry.intersectionRatio >= t,
            );
          handleChange(intersecting, observerEntry);
        }
      },
      { root, rootMargin, threshold },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [target, root, rootMargin, threshold, frozen]);

  /* When the observed node detaches, fall back to the initial state so a
     remounted node starts from a clean slate. */
  useEffect(() => {
    if (!target && !freezeOnceVisible) {
      setIsIntersecting(initialIsIntersecting);
      setEntry(undefined);
    }
  }, [target, freezeOnceVisible, initialIsIntersecting]);

  return { ref: setTarget, isIntersecting, entry };
}
