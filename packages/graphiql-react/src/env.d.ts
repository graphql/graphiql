declare namespace globalThis {
  import type * as monaco from 'monaco-editor';
  var MonacoEnvironment: monaco.Environment;
  // Needs for cypress
  var __MONACO = monaco;
}

declare module 'monaco-editor/esm/vs/editor/common/standalone/standaloneEnums.js' {
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  export { KeyCode } from 'monaco-editor';
}

declare module 'monaco-editor/esm/vs/editor/common/services/editorBaseApi.js' {
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  export { KeyMod } from 'monaco-editor';
}
declare module 'monaco-editor/esm/vs/base/common/uri.js' {
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  export { Uri as URI } from 'monaco-editor';
}
