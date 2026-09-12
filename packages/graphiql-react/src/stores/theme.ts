import type * as monaco from 'monaco-editor';
import { STORAGE_KEY, MONACO_THEME_NAME } from '../constants';
import type { StateCreator } from 'zustand';
import type { SlicesWithActions, Theme } from '../types';

type MonacoTheme =
  | monaco.editor.BuiltinTheme
  | (typeof MONACO_THEME_NAME)[keyof typeof MONACO_THEME_NAME]
  | ({} & string);

export interface ThemeSlice {
  theme: Theme;
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
  editorTheme?: {
    dark: MonacoTheme;
    light: MonacoTheme;
  };
}

type CreateThemeSlice = (
  initial: Pick<ThemeProps, 'editorTheme'>,
) => StateCreator<
  SlicesWithActions,
  [],
  [],
  ThemeSlice & {
    actions: ThemeActions;
  }
>;

export const createThemeSlice: CreateThemeSlice = () => (set, get) => ({
  theme: null,
  actions: {
    setTheme(theme) {
      const { storage } = get();
      storage.set(STORAGE_KEY.theme, theme ?? '');
      document.body.classList.remove('graphiql-light', 'graphiql-dark');
      if (theme) {
        document.body.classList.add(`graphiql-${theme}`);
        document.documentElement.setAttribute('data-theme', theme);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      set({ theme });
    },
  },
});
