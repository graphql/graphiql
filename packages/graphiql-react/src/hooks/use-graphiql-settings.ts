import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

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

function readSettings(): GraphiQLSettings {
  if (typeof window === 'undefined') {
    return DEFAULTS;
  }
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULTS;
    }
    const parsed = JSON.parse(raw) as Partial<GraphiQLSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function writeSettings(settings: GraphiQLSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // noop — quota or privacy mode
  }
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
  const [settings, setSettings] = useState<GraphiQLSettings>(readSettings);

  function setTheme(theme: Theme) {
    setSettings(s => ({ ...s, theme }));
  }

  function setDensity(density: Density) {
    setSettings(s => ({ ...s, density }));
  }

  function setFontSize(fontSize: FontSize) {
    setSettings(s => ({ ...s, fontSize }));
  }

  // Persist and apply data-* attributes whenever settings change.
  useEffect(() => {
    writeSettings(settings);

    const target =
      containerRef?.current ??
      document.querySelector<HTMLElement>('.graphiql-container');
    if (!target) {
      return;
    }

    target.setAttribute('data-theme', resolveTheme(settings.theme));
    target.setAttribute('data-density', settings.density);
    target.setAttribute('data-font-size', settings.fontSize);
  }, [settings, containerRef]);

  // When theme is 'auto', track system preference changes live.
  useEffect(() => {
    if (settings.theme !== 'auto') {
      return;
    }

    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    function onSystemThemeChange() {
      const target =
        containerRef?.current ??
        document.querySelector<HTMLElement>('.graphiql-container');
      if (!target) {
        return;
      }
      target.setAttribute('data-theme', resolveTheme('auto'));
    }

    mql.addEventListener('change', onSystemThemeChange);
    return () => {
      mql.removeEventListener('change', onSystemThemeChange);
    };
  }, [settings.theme, containerRef]);

  return { ...settings, setTheme, setDensity, setFontSize };
}
