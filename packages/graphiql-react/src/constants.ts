import { initializeMode } from 'monaco-graphql/esm/initializeMode.js';
import { editor, KeyCode, KeyMod, Uri } from 'monaco-editor';
import { copyQuery, mergeQuery, prettifyEditors } from './editor';
import { executionStore } from './stores';

export const KEY_MAP = Object.freeze({
  prettify: ['Shift-Ctrl-P'],
  mergeFragments: ['Shift-Ctrl-M'],
  runQuery: ['Ctrl-Enter', 'Cmd-Enter'],
  autoComplete: ['Ctrl-Space'],
  copyQuery: ['Shift-Ctrl-C'],
  refetchSchema: ['Shift-Ctrl-R'],
  searchInEditor: ['Ctrl-F'],
  searchInDocs: ['Ctrl-K'],
} as const);

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
#   Prettify query:  ${KEY_MAP.prettify[0]} (or press the prettify button)
#
#  Merge fragments:  ${KEY_MAP.mergeFragments[0]} (or press the merge button)
#
#        Run Query:  ${KEY_MAP.runQuery[0]} (or press the play button)
#
#    Auto Complete:  ${KEY_MAP.autoComplete[0]} (or just start typing)
#

`;

export const KEY_BINDINGS = Object.freeze({
  prettify: {
    id: 'graphql-prettify',
    label: 'Prettify Editors',
    contextMenuGroupId: 'graphql',
    // eslint-disable-next-line no-bitwise
    keybindings: [KeyMod.Shift | KeyMod.WinCtrl | KeyCode.KeyP],
    run: prettifyEditors,
  },
  mergeFragments: {
    id: 'graphql-merge',
    label: 'Merge Fragments into Query',
    contextMenuGroupId: 'graphql',
    // eslint-disable-next-line no-bitwise
    keybindings: [KeyMod.Shift | KeyMod.WinCtrl | KeyCode.KeyM],
    run: mergeQuery,
  },
  runQuery: {
    id: 'graphql-run',
    label: 'Run Operation',
    contextMenuGroupId: 'graphql',
    // eslint-disable-next-line no-bitwise
    keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
    run() {
      // Fixes error - Cannot access 'executionStore' before initialization
      return executionStore.getState().run();
    },
  },
  copyQuery: {
    id: 'graphql-copy',
    label: 'Copy Query',
    contextMenuGroupId: 'graphql',
    // eslint-disable-next-line no-bitwise
    keybindings: [KeyMod.Shift | KeyMod.WinCtrl | KeyCode.KeyC],
    run: copyQuery,
  },
});

const QUERY_URI = 'query.graphql';
const VARIABLE_URI = 'variable.json';
const HEADER_URI = 'header.json';
const RESPONSE_URI = 'response.json';

export const MONACO_GRAPHQL_API = initializeMode({
  diagnosticSettings: {
    validateVariablesJSON: {
      [Uri.file(QUERY_URI).toString()]: [Uri.file(VARIABLE_URI).toString()],
    },
    jsonDiagnosticSettings: {
      validate: true,
      schemaValidation: 'error',
      // set these again, because we are entirely re-setting them here
      allowComments: true,
      trailingCommas: 'ignore',
    },
  },
});

export function getOrCreateModel({
  uri,
  value,
}: {
  uri: string;
  value: string;
}) {
  const language = uri.split('.').pop();
  const model = editor.getModel(Uri.file(uri));
  if (model) {
    console.log('✅ Model', uri, 'is already created');
    return model;
  }
  console.log('🚀 Model', uri, "isn't yet created, creating...");
  return editor.createModel(value, language, Uri.file(uri));
}

export const QUERY_MODEL = getOrCreateModel({
  uri: QUERY_URI,
  value: DEFAULT_QUERY,
});

export const VARIABLE_MODEL = getOrCreateModel({
  uri: VARIABLE_URI,
  value: '',
});

export const HEADER_MODEL = getOrCreateModel({
  uri: HEADER_URI,
  value: '',
});

export const RESPONSE_MODEL = getOrCreateModel({
  uri: RESPONSE_URI,
  value: '',
});
