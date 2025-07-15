/* eslint-disable no-bitwise */
import type { DiagnosticSettings } from 'monaco-graphql';
import type * as monaco from 'monaco-editor';
import { KeyCode, KeyMod } from './utility';
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
export const JSON_DIAGNOSTIC_OPTIONS: monaco.languages.json.DiagnosticsOptions =
  {
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

export const DEFAULT_PRETTIFY_QUERY: EditorSlice['onPrettifyQuery'] =
  async query => {
    // We don't need to load Prettier initially; it's only used when the 'Format Query' button or shortcut is triggered
    const [
      prettier,
      // @ts-expect-error – no types
      { printers },
      { parsers },
    ] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/graphql'),
      import('prettier/parser-graphql'),
    ]);

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

export const MONACO_THEME_NAME = {
  dark: 'graphiql-DARK',
  light: 'graphiql-LIGHT',
} as const;

const colors = {
  transparent: '#ffffff00',
  bg: {
    dark: '#212a3b',
    light: '#ffffffff',
  },
  primary: {
    dark: '#ff5794',
    light: '#d60590',
  },
  primaryBg: {
    dark: '#ff579419',
    light: '#d6059019',
  },
  secondary: {
    dark: '#b7c2d711',
    light: '#3b4b6811',
  },
};

const getBaseColors = (
  theme: 'dark' | 'light',
): monaco.editor.IStandaloneThemeData['colors'] => ({
  'editor.background': colors.transparent, // white with a 00 alpha value
  'scrollbar.shadow': colors.transparent, // Scrollbar shadow to indicate that the view is scrolled
  'textLink.foreground': colors.primary[theme], // Foreground color for links in text
  'textLink.activeForeground': colors.primary[theme], // Foreground color for active links in text
  'editorLink.activeForeground': colors.primary[theme], // Color of active links
  'editorHoverWidget.background': colors.bg[theme], // Background color of the editor hover
  'list.hoverBackground': colors.primaryBg[theme], // List/Tree background when hovering over items using the mouse
  'menu.background': colors.bg[theme], // Background color of the context menu

  'editorSuggestWidget.background': colors.bg[theme], // Background color of the suggest widget
  'editorSuggestWidget.selectedBackground': colors.primaryBg[theme], // Background color of the selected entry in the suggest widget
  'editorSuggestWidget.selectedForeground': colors.primary[theme], // Foreground color of the selected entry in the suggest widget
  'quickInput.background': colors.bg[theme],
  'quickInputList.focusForeground': colors.primary[theme],
  'highlighted.label': colors.primary[theme],
  'quickInput.widget': colors.primary[theme],
  highlight: colors.primary[theme],
  'editorWidget.background': colors.bg[theme], // Background color of editor widgets, such as find/replace
  'input.background': colors.secondary[theme], // Input box background
  focusBorder: colors.primary[theme], // Overall border color for focused elements. This color is only used if not overridden by a component
  'toolbar.hoverBackground': colors.primaryBg[theme],
  'inputOption.hoverBackground': colors.primaryBg[theme],
  'quickInputList.focusBackground': colors.primaryBg[theme],
  'editorWidget.resizeBorder': colors.primary[theme],
  'pickerGroup.foreground': colors.primary[theme], // Quick picker color for grouping labels

  'menu.selectionBackground': colors.primaryBg[theme], // hover background
  'menu.selectionForeground': colors.primary[theme], // hover text color
});

export const MONACO_THEME_DATA: Record<
  'dark' | 'light',
  monaco.editor.IStandaloneThemeData
> = {
  dark: {
    base: 'vs-dark',
    inherit: true,
    colors: getBaseColors('dark'),
    rules: [
      {
        token: 'argument.identifier.gql',
        foreground: '#908aff',
      },
    ],
  },
  light: {
    base: 'vs',
    inherit: true,
    colors: getBaseColors('light'),
    rules: [
      {
        token: 'argument.identifier.gql',
        foreground: '#6c69ce',
      },
    ],
  },
};
