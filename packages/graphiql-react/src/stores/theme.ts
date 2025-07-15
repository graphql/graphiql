import { FC, ReactElement, useEffect } from 'react';
import type * as monaco from 'monaco-editor';
import { STORAGE_KEY, MONACO_THEME_NAME } from '../constants';
import { useMonaco } from './monaco';
import { useGraphiQL } from '../components';
import type { StateCreator } from 'zustand/index';
import type { SlicesWithActions, Theme } from '../types';

type MonacoTheme =
  | monaco.editor.BuiltinTheme
  | (typeof MONACO_THEME_NAME)[keyof typeof MONACO_THEME_NAME]
  | ({} & string);

export interface ThemeSlice {
  theme: Theme;

  editorTheme: {
    dark: MonacoTheme;
    light: MonacoTheme;
  };
}

export interface ThemeActions {
  /**
   * Set a new theme
   */
  setTheme: (newTheme: Theme) => void;
}

export interface ThemeProps {
  /**
   * @default null
   */
  defaultTheme?: Theme;

  /**
   * Sets the color theme for the monaco editors.
   * @default { dark: 'graphiql-DARK', light: 'graphiql-LIGHT' }
   */
  editorTheme?: ThemeSlice['editorTheme'];
}

type CreateThemeSlice = (initial: ThemeSlice) => StateCreator<
  SlicesWithActions,
  [],
  [],
  ThemeSlice & {
    actions: ThemeActions;
  }
>;

export const createThemeSlice: CreateThemeSlice = initial => set => ({
  // theme: null,
  ...initial,
  actions: {
    setTheme(theme) {
      set(({ editorTheme, storage }) => {
        storage.set(STORAGE_KEY.theme, theme ?? '');

        document.body.classList.remove('graphiql-light', 'graphiql-dark');
        if (theme) {
          document.body.classList.add(`graphiql-${theme}`);
        }
        const resolvedTheme = theme ?? getSystemTheme();
        monacoEditor.setTheme(editorTheme[resolvedTheme]);
        return { theme };
      });
    },
  }
});

export const ThemeStore: FC<ThemeStoreProps> = ({
  children,
  defaultTheme = null,
  editorTheme = MONACO_THEME_NAME,
}) => {
  const theme = useTheme(state => state.theme);
  const monaco = useMonaco(state => state.monaco);
  const storage = useGraphiQL(state => state.storage);
  useEffect(() => {
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
