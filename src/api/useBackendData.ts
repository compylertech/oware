// Small helper to fetch live backend data without flashing a seed/dummy
// value on first paint. Callers render their own loading UI (skeleton) while
// `loading` is true and `data` is null — never a fixture standing in for the
// real thing, since a fixture flashing before real numbers land reads as a bug.
//
// Fetched results are cached in-memory per `key`, shared across every mount
// for the lifetime of the page: revisiting a route within `staleMs` reuses the
// cached data with no loading flash and no refetch at all; past that window it
// still shows the cached data immediately but refetches in the background.

import { useEffect, useRef, useState } from "react";

type CacheEntry<T> = { data: T; fetchedAt: number };

const cache = new Map<string, CacheEntry<unknown>>();

// How long cached data is considered fresh enough to skip an automatic
// background refetch when a component remounts (e.g. navigating back).
const DEFAULT_STALE_MS = 60_000;

export function useBackendData<T>(
  key: string,
  fetcher: () => Promise<T>,
  staleMs: number = DEFAULT_STALE_MS,
): { data: T | null; loading: boolean } {
  const initialEntry = cache.get(key) as CacheEntry<T> | undefined;
  const [data, setData] = useState<T | null>(initialEntry?.data ?? null);
  const [loading, setLoading] = useState(!initialEntry);
  // Keep the latest fetcher without retriggering the effect on every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (entry) {
      setData(entry.data);
      setLoading(false);
      if (Date.now() - entry.fetchedAt < staleMs) return; // fresh enough — skip refetch
    } else {
      setLoading(true);
    }

    let alive = true;
    fetcherRef
      .current()
      .then((result) => {
        if (!alive || result == null) return;
        cache.set(key, { data: result, fetchedAt: Date.now() });
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        if (alive && !entry) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading };
}
