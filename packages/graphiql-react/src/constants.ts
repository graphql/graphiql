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
  path,
  value,
}: {
  path: `${string}.${string}`;
  value: string;
}) {
  const uri = Uri.file(path);
  const model = editor.getModel(uri);
  if (model) {
    // eslint-disable-next-line no-console
    console.info('✅ Model', path, 'is already created');
    return model;
  }
  // eslint-disable-next-line no-console
  console.info('🚀 Model', path, "isn't yet created, creating...");
  const language = path.split('.').at(-1)!;
  return editor.createModel(value, language, uri);
}

export const MODELS = {
  // TODO, maybe add DEFAUL_QUERY as default value
  query: getOrCreateModel({ path: QUERY_URI, value: '' }),
  variable: getOrCreateModel({ path: VARIABLE_URI, value: '' }),
  header: getOrCreateModel({ path: 'header.json', value: '' }),
  response: getOrCreateModel({ path: 'response.json', value: '' }),
};
