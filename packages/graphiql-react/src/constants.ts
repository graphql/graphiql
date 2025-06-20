/* eslint-disable no-bitwise */
import { initializeMode } from 'monaco-graphql/esm/lite.js';
import { parse, print } from 'graphql';
import { KeyCode, KeyMod, Uri, languages } from './monaco-editor';
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
  operationName: 'operationName',
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

export const QUERY_URI = Uri.file('query.graphql');
export const VARIABLE_URI = Uri.file('variable.json');
export const HEADER_URI = Uri.file('header.json');
export const RESPONSE_URI = Uri.file('response.json');

// set these early on so that initial variables with comments don't flash an error
const JSON_DIAGNOSTIC_OPTIONS: languages.json.DiagnosticsOptions = {
  // Fixes Comments are not permitted in JSON.(521)
  allowComments: true,
  // Fixes Trailing comma json(519)
  trailingCommas: 'ignore',
};

// Set diagnostics options for JSON
languages.json.jsonDefaults.setDiagnosticsOptions(JSON_DIAGNOSTIC_OPTIONS);

export const MONACO_GRAPHQL_API = initializeMode({
  diagnosticSettings: {
    validateVariablesJSON: {
      [QUERY_URI.toString()]: [VARIABLE_URI.toString()],
    },
    jsonDiagnosticSettings: {
      validate: true,
      schemaValidation: 'error',
      // Set these again, because we are entirely re-setting them here
      ...JSON_DIAGNOSTIC_OPTIONS,
    },
  },
});

export const DEFAULT_PRETTIFY_QUERY: EditorSlice['onPrettifyQuery'] = query =>
  print(parse(query));
