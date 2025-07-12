/* eslint-disable no-bitwise */
import { initializeMode } from 'monaco-graphql/esm/lite.js';
import type { DiagnosticSettings } from 'monaco-graphql';
import { KeyCode, KeyMod, languages } from './monaco-editor';
import type { EditorSlice } from './stores';

export const isMacOs =
  typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');

export function formatShortcutForOS(key: string, replaced = '⌘') {
  return isMacOs ? key.replace('Ctrl', replaced) : key;
}

export const KEY_MAP = Object.freeze({
  prettify: {
    key: 'Shift-Ctrl-P',
    keybindings: [KeyMod.Shift | KeyMod.WinCtrl | KeyCode.KeyP],
  },
  mergeFragments: {
    key: 'Shift-Ctrl-M',
    keybindings: [KeyMod.Shift | KeyMod.WinCtrl | KeyCode.KeyM],
  },
  runQuery: {
    key: 'Ctrl-Enter',
    keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
  },
  autoComplete: {
    key: 'Space',
  },
  copyQuery: {
    key: 'Shift-Ctrl-C',
    keybindings: [KeyMod.Shift | KeyMod.WinCtrl | KeyCode.KeyC],
  },
  refetchSchema: {
    key: 'Shift-Ctrl-R',
  },
  searchInEditor: {
    key: 'Ctrl-F',
  },
  searchInDocs: {
    key: 'Ctrl-Alt-K',
  },
});

export const STORAGE_KEY = {
  headers: 'headers',
  visiblePlugin: 'visiblePlugin',
  query: 'query',
  variables: 'variables',
  tabs: 'tabState',
  persistHeaders: 'shouldPersistHeaders',
  theme: 'theme',
} as const;

export const DEFAULT_QUERY = `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and testing
# GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#   Prettify query:  ${KEY_MAP.prettify.key} (or press the prettify button)
#
#  Merge fragments:  ${KEY_MAP.mergeFragments.key} (or press the merge button)
#
#        Run Query:  ${formatShortcutForOS(KEY_MAP.runQuery.key, 'Cmd')} (or press the play button)
#
#    Auto Complete:  ${KEY_MAP.autoComplete.key} (or just start typing)
#

`;

export const KEY_BINDINGS = {
  prettify: {
    id: 'graphql-prettify',
    label: 'Prettify Editors',
    contextMenuGroupId: 'graphql',
    keybindings: KEY_MAP.prettify.keybindings,
  },
  mergeFragments: {
    id: 'graphql-merge',
    label: 'Merge Fragments into Query',
    contextMenuGroupId: 'graphql',
    keybindings: KEY_MAP.mergeFragments.keybindings,
  },
  runQuery: {
    id: 'graphql-run',
    label: 'Run Operation',
    contextMenuGroupId: 'graphql',
    keybindings: KEY_MAP.runQuery.keybindings,
  },
  copyQuery: {
    id: 'graphql-copy',
    label: 'Copy Query',
    contextMenuGroupId: 'graphql',
    keybindings: KEY_MAP.copyQuery.keybindings,
  },
} as const;

export const URI_NAME = {
  operation: 'operation.graphql',
  schema: 'schema.graphql',

  variables: 'variables.json',
  requestHeaders: 'request-headers.json',
  response: 'response.json',
} as const;

// set these early on so that initial variables with comments don't flash an error
export const JSON_DIAGNOSTIC_OPTIONS: languages.json.DiagnosticsOptions = {
  // Fixes Comments are not permitted in JSON.(521)
  allowComments: true,
  // Fixes Trailing comma json(519)
  trailingCommas: 'ignore',
};

export const MONACO_GRAPHQL_DIAGNOSTIC_SETTINGS: DiagnosticSettings = {
  validateVariablesJSON: {},
  jsonDiagnosticSettings: {
    validate: true,
    schemaValidation: 'error',
    // Set these again, because we are entirely re-setting them here
    ...JSON_DIAGNOSTIC_OPTIONS,
  },
};

export const MONACO_GRAPHQL_API = initializeMode({
  diagnosticSettings: MONACO_GRAPHQL_DIAGNOSTIC_SETTINGS,
});

export const DEFAULT_PRETTIFY_QUERY: EditorSlice['onPrettifyQuery'] =
  async query => {
    // We don't need to load Prettier initially; it's only used when the 'Format Query' button or shortcut is triggered
    // @ts-expect-error -- wrong types
    const { printers } = await import('prettier/plugins/graphql');
    const { parsers } = await import('prettier/parser-graphql');
    const prettier = await import('prettier/standalone');

    return prettier.format(query, {
      parser: 'graphql',
      plugins: [
        // Fix: Couldn't find plugin for AST format "graphql"
        { printers },
        // @ts-expect-error -- Fix: Couldn't resolve parser "graphql"
        { parsers },
      ],
    });
  };
