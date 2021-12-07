import {
  UseEditorOptions,
  useMonaco,
  useMonacoEditor,
  UseMonacoOptions,
  UseTextModelOptions,
} from 'use-monaco';
import { initializeMode } from 'monaco-graphql/src/initializeMode';
import {
 // MonacoGraphQLAPI,
  MonacoGraphQLInitializeConfig,
} from 'monaco-graphql';

import { LANGUAGE_ID } from 'monaco-graphql/src/initializeMode';

export function useMonacoGraphQL(
  options?: UseMonacoOptions,
  graphqlOptions?: MonacoGraphQLInitializeConfig,
) {
// ): MonacoGraphQLAPI {
  useMonaco({
    languages: ['json', 'graphql'],
    ...options,
    defaultEditorOptions: {
      quickSuggestions: false,
      formatOnPaste: true,
      smoothScrolling: true,
      automaticLayout: false,
      ...options?.defaultEditorOptions,
    },
  });
  return initializeMode(graphqlOptions);
}

export function useGraphQLEditor(
  options:
    | (UseEditorOptions & UseTextModelOptions & UseMonacoOptions)
    | undefined,
) {
  return useMonacoEditor({
    ...options,
    language: LANGUAGE_ID,
  });
}
