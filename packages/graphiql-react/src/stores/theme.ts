import { FC, ReactElement, ReactNode, useEffect } from 'react';
import { storageStore } from './index';
import { createStore } from 'zustand';
import { createBoundedUseStore } from '../utility';
import { EDITOR_THEME } from '../utility/create-editor';
import { editor as monacoEditor } from '../monaco-editor';

/**
 * The value `null` semantically means that the user does not explicitly choose
 * any theme, so we use the system default.
 */
export type Theme = 'light' | 'dark' | null;

type MonacoTheme =
  | monacoEditor.BuiltinTheme
  | (typeof EDITOR_THEME)[keyof typeof EDITOR_THEME]
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
    storage.set(STORAGE_KEY, theme ?? '');
    set({ theme });
  },
}));

export const ThemeStore: FC<ThemeStoreProps> = ({
  children,
  defaultTheme = null,
  editorTheme = EDITOR_THEME,
}) => {
  const theme = useThemeStore(store => store.theme);
  useEffect(() => {
    const { storage } = storageStore.getState();

    function getInitialTheme() {
      const stored = storage.get(STORAGE_KEY);
      switch (stored) {
        case 'light':
          return 'light';
        case 'dark':
          return 'dark';
        default:
          if (typeof stored === 'string') {
            // Remove the invalid stored value
            storage.set(STORAGE_KEY, '');
          }
          return defaultTheme;
      }
    }

    themeStore.setState({ theme: getInitialTheme() });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  useEffect(() => {
    document.body.classList.remove('graphiql-light', 'graphiql-dark');
    if (theme) {
      document.body.classList.add(`graphiql-${theme}`);
    }
    const resolvedTheme = theme ?? getSystemTheme();
    monacoEditor.setTheme(editorTheme[resolvedTheme]);
  }, [theme, editorTheme]);

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

const STORAGE_KEY = 'theme';

export const useThemeStore = createBoundedUseStore(themeStore);
