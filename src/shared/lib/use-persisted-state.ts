'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Small helper for sticking a piece of UI state into localStorage so the
 * workspace reopens the way the user left it (open/closed panels, toggles,
 * that kind of thing). Reads lazily on init and writes back on change.
 *
 * Anything stored here is per-browser, so don't put user-critical data in it;
 * treat it as UI chrome only.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  // Avoid writing on first mount when we just read the value back.
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage might be full or disabled (private mode) — silently ignore
    }
  }, [key, value]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next));
  }, []);

  return [value, set];
}
