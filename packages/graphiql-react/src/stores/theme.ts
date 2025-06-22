import type { StateCreator } from 'zustand';
import type { EDITOR_THEME } from '../utility/create-editor';
import { editor as monacoEditor } from '../monaco-editor';
import type { SlicesWithActions } from '../types';

/**
 * The value `null` semantically means that the user does not explicitly choose
 * any theme, so we use the system default.
 */
export type Theme = 'light' | 'dark' | null;

type MonacoTheme =
  | monacoEditor.BuiltinTheme
  | (typeof EDITOR_THEME)[keyof typeof EDITOR_THEME]
  | ({} & string);

export interface ThemeSlice {
  theme?: Theme;

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

export const createThemeSlice: CreateThemeSlice = initial => set => ({
  ...initial,
  actions: {
    setTheme(theme) {
      set(({ editorTheme }) => {
        document.body.classList.remove('graphiql-light', 'graphiql-dark');
        if (theme) {
          document.body.classList.add(`graphiql-${theme}`);
        }
        const resolvedTheme = theme ?? getSystemTheme();
        monacoEditor.setTheme(editorTheme[resolvedTheme]);
        return { theme };
      });
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
