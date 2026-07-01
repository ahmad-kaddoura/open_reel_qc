'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useSettingsStore } from '@/features/settings/store';
import { applyThemeClass, readPersistedTheme, resolveThemeClass } from '@/features/settings/theme-utils';

export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.settings.theme);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolveThemeClass(theme));

  useLayoutEffect(() => {
    setResolved(resolveThemeClass(theme));
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolved(resolveThemeClass('system'));
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  return resolved;
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.settings.theme);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const saved = readPersistedTheme();
    applyThemeClass(saved ?? useSettingsStore.getState().settings.theme);
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    applyThemeClass(theme);
  }, [ready, theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeClass('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  useEffect(() => {
    const apply = () => applyThemeClass(useSettingsStore.getState().settings.theme);
    if (useSettingsStore.persist.hasHydrated()) {
      apply();
      return;
    }
    return useSettingsStore.persist.onFinishHydration(apply);
  }, []);

  return children;
}
