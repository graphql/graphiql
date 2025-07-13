import type { KeyboardEventHandler, RefObject } from 'react';
import type * as monaco from '../monaco-editor';
import type { MonacoEditor } from '../types';
import { monacoStore } from '../stores';

export const EDITOR_THEME = {
  dark: 'graphiql-DARK',
  light: 'graphiql-LIGHT',
} as const;

export const onEditorContainerKeyDown: KeyboardEventHandler<
  HTMLDivElement
> = event => {
  const el = event.currentTarget;
  const isFocused = el === document.activeElement;
  if (isFocused && event.code === 'Enter') {
    event.preventDefault();
    el.querySelector('textarea')?.focus();
  }
};

export function getOrCreateModel({
  uri: $uri,
  value,
}: {
  uri: string;
  value: string;
}) {
  const { monaco } = monacoStore.getState();
  const uri = monaco.Uri.file($uri);
  const model = monaco.editor.getModel(uri);
  const language = uri.path.split('.').at(-1)!;
  return model ?? monaco.editor.createModel(value, language, uri);
}

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

export const editorThemeDark: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  colors: getBaseColors('dark'),
  rules: [
    {
      token: 'argument.identifier.gql',
      foreground: '#908aff',
    },
  ],
};

export const editorThemeLight: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  colors: getBaseColors('light'),
  rules: [
    {
      token: 'argument.identifier.gql',
      foreground: '#6c69ce',
    },
  ],
};

export function createEditor(
  domElement: RefObject<HTMLDivElement>,
  options: monaco.editor.IStandaloneEditorConstructionOptions,
): MonacoEditor {
  const { model } = options;
  if (!model) {
    throw new Error('options.model is required');
  }
  const language = model.uri.path.split('.').at(-1)!;
  const { monaco } = monacoStore.getState();
  return monaco.editor.create(domElement.current, {
    language,
    automaticLayout: true,
    fontSize: 15,
    minimap: { enabled: false }, // disable the minimap
    tabSize: 2,
    renderLineHighlight: 'none', // Remove a line selection border
    stickyScroll: { enabled: false }, // Disable sticky scroll widget
    overviewRulerLanes: 0, // remove unnecessary error highlight on the scroll
    scrollbar: {
      verticalScrollbarSize: 10,
    },
    scrollBeyondLastLine: false, // cleans up unnecessary "padding-bottom" on each editor
    fontFamily: '"Fira Code"',
    // Enable font ligatures and fix incorrect caret position on Windows
    // See: https://github.com/graphql/graphiql/issues/4040
    fontLigatures: true,
    lineNumbersMinChars: 2, // reduce line numbers width on the left size
    tabIndex: -1, // Do not allow tabbing into the editor, only via by pressing Enter or its container
    ...options,
  });
}
