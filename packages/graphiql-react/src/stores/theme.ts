import { FC, ReactElement, ReactNode, useEffect } from 'react';
import { storageStore } from './storage';
import { createStore } from 'zustand';
import { createBoundedUseStore } from '../utility';
import type * as monaco from 'monaco-editor';
import { STORAGE_KEY, MONACO_THEME_NAME } from '../constants';
import { useMonaco } from './monaco';

/**
 * The value `null` semantically means that the user does not explicitly choose
 * any theme, so we use the system default.
 */
export type Theme = 'light' | 'dark' | null;

type MonacoTheme =
  | monaco.editor.BuiltinTheme
  | (typeof MONACO_THEME_NAME)[keyof typeof MONACO_THEME_NAME]
  | ({} & string);

interface ThemeStoreType {
  theme: Theme;

  /**
   * Set a new theme
   */
  setTheme: (newTheme: Theme) => void;
}

interface ThemeStoreProps {
  children: ReactNode;

  /**
   * @default null
   */
  defaultTheme?: Theme;

  /**
   * Sets the color theme for the monaco editors.
   * @default { dark: 'graphiql-DARK', light: 'graphiql-LIGHT' }
   */
  editorTheme?: {
    dark: MonacoTheme;
    light: MonacoTheme;
  };
}

export const themeStore = createStore<ThemeStoreType>(set => ({
  theme: null,
  setTheme(theme) {
    const { storage } = storageStore.getState();
    storage.set(STORAGE_KEY.theme, theme ?? '');
    set({ theme });
  },
}));

export const ThemeStore: FC<ThemeStoreProps> = ({
  children,
  defaultTheme = null,
  editorTheme = MONACO_THEME_NAME,
}) => {
  const theme = useTheme(state => state.theme);
  const monaco = useMonaco(state => state.monaco);

  useEffect(() => {
    const { storage } = storageStore.getState();

    function getInitialTheme() {
      const stored = storage.get(STORAGE_KEY.theme);
      switch (stored) {
        case 'light':
          return 'light';
        case 'dark':
          return 'dark';
        default:
          if (typeof stored === 'string') {
            // Remove the invalid stored value
            storage.set(STORAGE_KEY.theme, '');
          }
          return defaultTheme;
      }
    }

    themeStore.setState({ theme: getInitialTheme() });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  useEffect(() => {
    if (!monaco) {
      return;
    }
    document.body.classList.remove('graphiql-light', 'graphiql-dark');
    if (theme) {
      document.body.classList.add(`graphiql-${theme}`);
    }
    const resolvedTheme = theme ?? getSystemTheme();
    monaco.editor.setTheme(editorTheme[resolvedTheme]);
  }, [theme, editorTheme, monaco]);

  return children as ReactElement;
};

/**
 * Get the resolved theme - dark or light
 * @see https://github.com/pacocoursey/next-themes/blob/c89d0191ce0f19215d7ddfa9eb28e1e4f94d37e5/next-themes/src/index.tsx#L255
 */
function getSystemTheme() {
  const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = mediaQueryList.matches;
  const systemTheme = isDark ? 'dark' : 'light';
  return systemTheme;
}

export const useTheme = createBoundedUseStore(themeStore);
