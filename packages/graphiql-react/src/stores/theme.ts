import type * as monaco from 'monaco-editor';
import { STORAGE_KEY, MONACO_THEME_NAME } from '../constants';
import { monacoStore } from './monaco';
import type { StateCreator } from 'zustand';
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

type CreateThemeSlice = (
  initial: Pick<ThemeSlice, 'editorTheme'>,
) => StateCreator<
  SlicesWithActions,
  [],
  [],
  ThemeSlice & {
    actions: ThemeActions;
  }
>;

export const createThemeSlice: CreateThemeSlice = initial => (set, get) => ({
  theme: null,
  ...initial,
  actions: {
    setTheme(theme) {
      const { storage, editorTheme } = get();
      storage.set(STORAGE_KEY.theme, theme ?? '');
      document.body.classList.remove('graphiql-light', 'graphiql-dark');
      if (theme) {
        document.body.classList.add(`graphiql-${theme}`);
      }
      const { monaco } = monacoStore.getState();
      const resolvedTheme = theme ?? getSystemTheme();
      const monacoTheme = editorTheme[resolvedTheme];
      monaco?.editor.setTheme(monacoTheme);
      set({ theme });
    },
  },
});

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
