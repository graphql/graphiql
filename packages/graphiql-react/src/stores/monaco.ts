import { createStore } from 'zustand';
import type { MonacoGraphQLAPI } from 'monaco-graphql';
import { createBoundedUseStore } from '../utility';
import {
  EDITOR_THEME,
  editorThemeDark,
  editorThemeLight,
} from '../utility/create-editor';
import {
  JSON_DIAGNOSTIC_OPTIONS,
  MONACO_GRAPHQL_DIAGNOSTIC_SETTINGS,
} from '../constants';

interface ThemeStoreType {
  monaco: typeof import('monaco-editor');
  monacoGraphQL: MonacoGraphQLAPI;
  actions: {
    initialize: () => Promise<void>;
  };
}

export const monacoStore = createStore<ThemeStoreType>(set => ({
  monaco: null!,
  monacoGraphQL: null!,
  actions: {
    async initialize() {
      const monaco = await import('monaco-editor');
      const { initializeMode } = await import('monaco-graphql/esm/lite.js');
      monaco.editor.defineTheme(EDITOR_THEME.dark, editorThemeDark);
      monaco.editor.defineTheme(EDITOR_THEME.light, editorThemeLight);
      /**
       * Set diagnostics options for JSON
       *
       * Setting it on mount fix Uncaught TypeError: Cannot read properties of undefined (reading 'jsonDefaults')
       * @see https://github.com/graphql/graphiql/pull/4042#issuecomment-3017167375
       */
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions(
        JSON_DIAGNOSTIC_OPTIONS,
      );

      const monacoGraphQL = initializeMode({
        diagnosticSettings: MONACO_GRAPHQL_DIAGNOSTIC_SETTINGS,
      });

      set({
        monaco,
        monacoGraphQL,
      });
    },
  },
}));

export const useMonaco = createBoundedUseStore(monacoStore);
