// Small helper to fetch live backend data without flashing a seed/dummy
// value on first paint. Callers render their own loading UI (skeleton) while
// `loading` is true and `data` is null - never a fixture standing in for the
// real thing, since a fixture flashing before real numbers land reads as a bug.
//
// Fetched results are cached in-memory per `key`, shared across every mount
// for the lifetime of the page: revisiting a route within `staleMs` reuses the
// cached data with no loading flash and no refetch at all; past that window it
// still shows the cached data immediately but refetches in the background.
//
// The cache is a proper shared store (subscribe/notify), not just a memo: if
// two components read the same key (e.g. a page's table and the sidebar's
// count badge), refreshBackendData() updates both at once - necessary after a
// mutation (approve/reject a loan, etc.) so every reader of that key reflects
// the new state without a full page reload.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type CacheEntry<T> = { data: T; fetchedAt: number };

const cache = new Map<string, CacheEntry<unknown>>();
const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

function subscribe(key: string, listener: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set?.size === 0) listeners.delete(key);
  };
}

// How long cached data is considered fresh enough to skip an automatic
// background refetch when a component remounts (e.g. navigating back).
const DEFAULT_STALE_MS = 60_000;

/** Re-fetch `key` right now and push the result to every mounted reader of
 * it. Use after a mutation that invalidates cached data - e.g. approving a
 * loan should update both the approvals queue and any badge counting it. */
export async function refreshBackendData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const result = await fetcher();
  cache.set(key, { data: result, fetchedAt: Date.now() });
  notify(key);
  return result;
}

export function useBackendData<T>(
  key: string,
  fetcher: () => Promise<T>,
  staleMs: number = DEFAULT_STALE_MS,
): { data: T | null; loading: boolean } {
  const [loading, setLoading] = useState(() => !cache.has(key));
  // Keep the latest fetcher without retriggering the effect on every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const data = useSyncExternalStore(
    (onStoreChange) => subscribe(key, onStoreChange),
    () => (cache.get(key) as CacheEntry<T> | undefined)?.data ?? null,
    () => null, // SSR/first-paint snapshot - never has cached data
  );

  useEffect(() => {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (entry) {
      setLoading(false);
      if (Date.now() - entry.fetchedAt < staleMs) return; // fresh enough - skip refetch
    } else {
      setLoading(true);
    }

    let alive = true;
    fetcherRef
      .current()
      .then((result) => {
        if (!alive || result == null) return;
        cache.set(key, { data: result, fetchedAt: Date.now() });
        notify(key);
      })
      .catch(() => {
        /* keep whatever's cached (possibly nothing) on failure */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading };
}
