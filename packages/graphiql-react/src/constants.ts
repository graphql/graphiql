/* eslint-disable no-bitwise */
import type { DiagnosticSettings } from 'monaco-graphql';
import type * as monaco from 'monaco-editor';
import { KeyCode, KeyMod } from './utility/monaco-ssr';
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
  saveQuery: {
    key: 'Ctrl-S',
    keybindings: [KeyMod.CtrlCmd | KeyCode.KeyS],
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
  responseView: 'responseView',
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
  saveQuery: {
    id: 'graphql-save',
    label: 'Save Query',
    contextMenuGroupId: 'graphql',
    keybindings: KEY_MAP.saveQuery.keybindings,
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
    const [prettier, { printers }, { parsers }] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/graphql'),
      import('prettier/parser-graphql'),
    ]);

    return prettier.format(query, {
      parser: 'graphql',
      plugins: [
        // Fix: Couldn't find plugin for AST format "graphql"
        { printers },
        { parsers },
      ],
    });
  };

export const MONACO_THEME_NAME = {
  dark: 'graphiql-DARK',
  light: 'graphiql-LIGHT',
} as const;

// v6 design token hex values, keyed for Monaco theme rules (no # prefix).
const TOKEN_COLORS = {
  dark: {
    // Foreground
    fgDefault: 'C9D1D9', // --fg-default
    fgMuted: '8B949E', // --fg-muted
    fgDisabled: '6E7681', // --fg-disabled
    // Accents
    accentBlue: '79C0FF', // --accent-blue
    accentGreenLight: '7EE787', // --accent-green-light
    accentOrange: 'FFA657', // --accent-orange
    accentPurple: 'D2A8FF', // --accent-purple
    accentPink: 'FF7B72', // --accent-pink
    // UI
    bgCanvas: '0D1117', // --bg-canvas
    bgOverlay: '21262D', // --bg-overlay
    accentGreen: '3FB950', // --accent-green (focus/primary)
    accentGreenBg: '3FB95019',
  },
  light: {
    // Foreground
    fgDefault: '1F2328', // --fg-default
    fgMuted: '636E7B', // --fg-muted (~40% oklch)
    fgDisabled: '9AA3AD', // --fg-disabled (~65% oklch)
    // Accents — tuned for AA contrast on white
    accentBlue: '0969DA', // --accent-blue light
    accentGreenLight: '1A7F37', // --accent-green-light light
    accentOrange: 'BC4C00', // --accent-orange light
    accentPurple: '8250DF', // --accent-purple light
    accentPink: 'CF222E', // --accent-pink light
    // UI
    bgCanvas: 'FFFFFF', // --bg-canvas
    bgOverlay: 'EAEEF2', // --bg-overlay
    accentGreen: '1A7F37', // --accent-green (focus/primary)
    accentGreenBg: '1A7F3719',
  },
} as const;

const getBaseColors = (
  theme: 'dark' | 'light',
): monaco.editor.IStandaloneThemeData['colors'] => {
  const t = TOKEN_COLORS[theme];
  return {
    'editor.background': '#ffffff00', // transparent — editor inherits container bg
    'scrollbar.shadow': '#ffffff00',
    'textLink.foreground': `#${t.accentGreen}`,
    'textLink.activeForeground': `#${t.accentGreen}`,
    'editorLink.activeForeground': `#${t.accentGreen}`,
    'editorHoverWidget.background': `#${t.bgCanvas}`,
    'list.hoverBackground': `#${t.accentGreenBg}`,
    'list.highlightForeground': `#${t.accentGreen}`,
    'list.focusHighlightForeground': `#${t.accentGreen}`,
    'menu.background': `#${t.bgCanvas}`,
    'editorSuggestWidget.background': `#${t.bgCanvas}`,
    'editorSuggestWidget.selectedBackground': `#${t.accentGreenBg}`,
    'editorSuggestWidget.selectedForeground': `#${t.accentGreen}`,
    'quickInput.background': `#${t.bgCanvas}`,
    'quickInputList.focusForeground': theme === 'dark' ? '#ffffff' : '#444444',
    'editorWidget.background': `#${t.bgCanvas}`,
    'input.background': `#${t.bgOverlay}`,
    focusBorder: `#${t.accentGreen}`,
    'toolbar.hoverBackground': `#${t.accentGreenBg}`,
    'inputOption.hoverBackground': `#${t.accentGreenBg}`,
    'quickInputList.focusBackground': `#${t.accentGreenBg}`,
    'editorWidget.resizeBorder': `#${t.accentGreen}`,
    'pickerGroup.foreground': `#${t.accentGreen}`,
    'menu.selectionBackground': `#${t.accentGreenBg}`,
    'menu.selectionForeground': `#${t.accentGreen}`,
  };
};

const getTokenRules = (
  theme: 'dark' | 'light',
): monaco.editor.ITokenThemeRule[] => {
  const t = TOKEN_COLORS[theme];
  return [
    // keywords: query, mutation, subscription, fragment, on, type, scalar, …
    { token: 'keyword.gql', foreground: t.accentPink },
    // field / argument names (lowercase identifiers)
    { token: 'key.identifier.gql', foreground: t.fgDefault },
    // $variable input variables
    { token: 'argument.identifier.gql', foreground: t.accentBlue },
    // TypeName (uppercase identifiers)
    { token: 'type.identifier.gql', foreground: t.accentOrange },
    // @directives
    { token: 'annotation.gql', foreground: t.accentPurple },
    // string literals
    { token: 'string.gql', foreground: t.accentBlue },
    { token: 'string.quote.gql', foreground: t.accentBlue },
    { token: 'string.escape.gql', foreground: t.accentBlue },
    // numbers
    { token: 'number.gql', foreground: t.accentBlue },
    { token: 'number.float.gql', foreground: t.accentBlue },
    // operators and delimiters use muted foreground
    { token: 'operator.gql', foreground: t.fgMuted },
    { token: 'delimiter.gql', foreground: t.fgMuted },
    // comments
    { token: 'comment.gql', foreground: t.fgDisabled, fontStyle: 'italic' },
    // definition names (identifiers following 'fragment'/'query'/etc.)
    // are caught by key.identifier.gql above, but named fragments benefit
    // from the green-light accent to mirror the design's "name" slot.
    { token: 'identifier.gql', foreground: t.accentGreenLight },
  ];
};

export const MONACO_THEME_DATA: Record<
  'dark' | 'light',
  monaco.editor.IStandaloneThemeData
> = {
  dark: {
    base: 'vs-dark',
    inherit: true,
    colors: getBaseColors('dark'),
    rules: getTokenRules('dark'),
  },
  light: {
    base: 'vs',
    inherit: true,
    colors: getBaseColors('light'),
    rules: getTokenRules('light'),
  },
};
