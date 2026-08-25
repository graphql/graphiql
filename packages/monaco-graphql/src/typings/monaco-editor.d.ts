/* eslint-disable @typescript-eslint/no-restricted-imports --
 * in this file is allowed to import monaco-editor
 */
declare module 'monaco-editor/editor/editor.main.js' {
  export * from 'monaco-editor';
}

declare module 'monaco-editor/editor/common/standalone/standaloneEnums.js' {
  export { MarkerSeverity } from 'monaco-editor';
}

declare module 'monaco-editor/language/json/monaco.contribution.js' {
  export {};
}
