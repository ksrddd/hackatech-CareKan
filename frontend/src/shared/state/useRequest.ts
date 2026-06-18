// Discriminated-union request state hooks. Two flavors:
//   useRequest  — action-triggered (forms): call .run(...) on submit
//   useQuery    — auto-fetch on mount + when deps change (data views)
//
// Both expose a sum type so every consumer can render
// idle / submitting / error / success without ad-hoc booleans.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

export type RequestState<T> =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; error: ApiError }
  | { kind: 'success'; data: T };

interface UseRequestReturn<T, A extends unknown[]> {
  state: RequestState<T>;
  run: (...args: A) => Promise<T | undefined>;
  reset: () => void;
}

export function useRequest<T, A extends unknown[]>(
  fn: (signal: AbortSignal, ...args: A) => Promise<T>,
): UseRequestReturn<T, A> {
  const [state, setState] = useState<RequestState<T>>({ kind: 'idle' });
  const ctrlRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      ctrlRef.current?.abort();
    };
  }, []);

  const run = useCallback(
    async (...args: A): Promise<T | undefined> => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      setState({ kind: 'submitting' });
      try {
        const data = await fn(ctrl.signal, ...args);
        if (!mountedRef.current || ctrl.signal.aborted) return undefined;
        setState({ kind: 'success', data });
        return data;
      } catch (err) {
        if (ctrl.signal.aborted) return undefined;
        const error =
          err instanceof ApiError
            ? err
            : new ApiError(
                err instanceof Error ? err.message : 'Unknown error',
                0,
              );
        if (mountedRef.current) setState({ kind: 'error', error });
        return undefined;
      }
    },
    [fn],
  );

  const reset = useCallback(() => setState({ kind: 'idle' }), []);

  return { state, run, reset };
}

interface UseQueryReturn<T> {
  state: RequestState<T>;
  refetch: () => void;
}

export function useQuery<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
  enabled: boolean = true,
): UseQueryReturn<T> {
  const [state, setState] = useState<RequestState<T>>({ kind: 'idle' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState({ kind: 'idle' });
      return;
    }
    const ctrl = new AbortController();
    setState({ kind: 'submitting' });
    let cancelled = false;
    fn(ctrl.signal)
      .then((data) => {
        if (!cancelled && !ctrl.signal.aborted) {
          setState({ kind: 'success', data });
        }
      })
      .catch((err: unknown) => {
        if (cancelled || ctrl.signal.aborted) return;
        const error =
          err instanceof ApiError
            ? err
            : new ApiError(
                err instanceof Error ? err.message : 'Unknown error',
                0,
              );
        setState({ kind: 'error', error });
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  return {
    state,
    refetch: useCallback(() => setTick((n) => n + 1), []),
  };
}
