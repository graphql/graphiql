import { useEffect, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import { useMonaco } from '../stores';
import { MONACO_THEME_NAME } from '../constants';
import { useEditorTheme } from '../components/provider';

export type Theme = 'auto' | 'light' | 'dark';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type FontSize = 'compact' | 'default' | 'large' | 'xl';

export type GraphiQLSettings = {
  theme: Theme;
  density: Density;
  fontSize: FontSize;
};

export const SETTINGS_STORAGE_KEY = 'graphiql:settings';

const DEFAULTS: GraphiQLSettings = {
  theme: 'auto',
  density: 'comfortable',
  fontSize: 'default',
};

function readStoredValue(): string | null {
  try {
    return localStorage.getItem(SETTINGS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseSettings(raw: string | null): GraphiQLSettings {
  if (!raw) {
    return DEFAULTS;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<GraphiQLSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

let storedValue: string | null | undefined;
let currentSettings = DEFAULTS;
const subscribers = new Set<() => void>();

function getSettings(): GraphiQLSettings {
  const raw = readStoredValue();
  if (raw !== storedValue) {
    storedValue = raw;
    currentSettings = parseSettings(raw);
  }
  return currentSettings;
}

function onStorage(event: StorageEvent) {
  if (event.key === SETTINGS_STORAGE_KEY || event.key === null) {
    subscribers.forEach(notify => notify());
  }
}

function subscribeSettings(notify: () => void) {
  if (subscribers.size === 0) {
    window.addEventListener('storage', onStorage);
  }
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
    if (subscribers.size === 0) {
      window.removeEventListener('storage', onStorage);
    }
  };
}

function updateSettings(patch: Partial<GraphiQLSettings>) {
  const next = { ...getSettings(), ...patch };
  const raw = JSON.stringify(next);
  currentSettings = next;
  storedValue = raw;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, raw);
  } catch {
    storedValue = readStoredValue();
  }
  subscribers.forEach(notify => notify());
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'auto') {
    return theme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function useGraphiQLSettings(
  containerRef?: RefObject<HTMLElement | null>,
) {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    () => DEFAULTS,
  );
  const monaco = useMonaco(state => state.monaco);
  const editorTheme = useEditorTheme() ?? MONACO_THEME_NAME;

  function setTheme(theme: Theme) {
    updateSettings({ theme });
  }

  function setDensity(density: Density) {
    updateSettings({ density });
  }

  function setFontSize(fontSize: FontSize) {
    updateSettings({ fontSize });
  }

  // Apply appearance to this container whenever shared settings change.
  useEffect(() => {
    const resolvedTheme = resolveTheme(settings.theme);

    const target =
      containerRef?.current ??
      document.querySelector<HTMLElement>('.graphiql-container');
    if (target) {
      target.setAttribute('data-theme', resolvedTheme);
      target.setAttribute('data-density', settings.density);
      target.setAttribute('data-font-size', settings.fontSize);
    }

    monaco?.editor.setTheme(editorTheme[resolvedTheme]);
  }, [settings, containerRef, monaco, editorTheme]);

  // When theme is 'auto', track system preference changes live.
  useEffect(() => {
    if (settings.theme !== 'auto') {
      return;
    }

    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    function onSystemThemeChange() {
      const resolvedTheme = resolveTheme('auto');

      const target =
        containerRef?.current ??
        document.querySelector<HTMLElement>('.graphiql-container');
      if (target) {
        target.setAttribute('data-theme', resolvedTheme);
      }

      monaco?.editor.setTheme(editorTheme[resolvedTheme]);
    }

    mql.addEventListener('change', onSystemThemeChange);
    return () => {
      mql.removeEventListener('change', onSystemThemeChange);
    };
  }, [settings.theme, containerRef, monaco, editorTheme]);

  return { ...settings, setTheme, setDensity, setFontSize };
}
