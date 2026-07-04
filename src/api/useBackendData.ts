// Small helper to swap a static seed array for live backend data without any
// visual change. It renders `initial` (the existing seed) for SSR and the first
// client paint — so markup is identical and hydration never mismatches — then
// replaces it with the fetched result once the request resolves. On any failure
// the service layer already falls back to the same fixtures, so the UI is safe.

import { useEffect, useRef, useState } from "react";

export function useBackendData<T>(fetcher: () => Promise<T>, initial: T): T {
  const [data, setData] = useState<T>(initial);
  // Keep the latest fetcher without retriggering the effect on every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let alive = true;
    fetcherRef
      .current()
      .then((result) => {
        if (alive && result != null) setData(result);
      })
      .catch(() => {
        /* keep the seed fallback */
      });
    return () => {
      alive = false;
    };
  }, []);

  return data;
}
