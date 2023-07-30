import { editor as MONACO_EDITOR } from 'monaco-editor';
import {
  OPERATIONS_MODEL,
  VARIABLES_MODEL,
  HEADERS_MODEL,
  RESULTS_MODEL,
  editorThemeDark,
  editorThemeLight,
} from './constants';

// this should be called somewhere else, but fine here for now
MONACO_EDITOR.defineTheme('graphiql-DARK', editorThemeDark);
MONACO_EDITOR.defineTheme('graphiql-LIGHT', editorThemeLight);

export function createEditor(
  type: 'operations' | 'variables' | 'headers' | 'results',
  domElement: HTMLDivElement,
) {
  return MONACO_EDITOR.create(domElement, {
    language: type === 'operations' ? 'graphql' : 'json',
    // the default theme
    theme: 'graphiql-DARK',
    automaticLayout: true,
    // folding: false, // disable folding
    fontFamily: "'Fira Code', monospace", // TODO: set the font (this is problematic because the font has to be installed locally)
    fontSize: 13, // default is 12
    // lineDecorationsWidth: 100,
    lineNumbersMinChars: 2,
    minimap: {
      enabled: false, // disable the minimap
    },
    overviewRulerLanes: 0, // remove unnecessary cruft on right side of editors
    scrollbar: {
      // hide the scrollbars
      horizontal: 'hidden',
      // vertical: 'hidden',
      verticalScrollbarSize: 4,
    },
    // scrollPredominantAxis: false,
    scrollBeyondLastLine: false, // cleans up unnecessary "padding" on the bottom of each editor
    tabSize: 2,
    wordWrap: 'on',
    // wrappingIndent: 'none',
    wrappingStrategy: 'advanced',
    fixedOverflowWidgets: true,
    ...(type === 'results' && {
      readOnly: true,
      lineNumbers: 'off',
    }),
    model: {
      operations: OPERATIONS_MODEL,
      variables: VARIABLES_MODEL,
      headers: HEADERS_MODEL,
      results: RESULTS_MODEL,
    }[type],
  });
}
