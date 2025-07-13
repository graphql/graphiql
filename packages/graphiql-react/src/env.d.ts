/* eslint-disable @typescript-eslint/no-restricted-imports */
declare namespace globalThis {
  import type * as monaco from 'monaco-editor';
  var MonacoEnvironment: monaco.Environment;
  // Needs for cypress
  var __MONACO = monaco;
}

declare module 'monaco-editor/esm/vs/editor/common/standalone/standaloneEnums.js' {
  export { KeyCode } from 'monaco-editor';
}

declare module 'monaco-editor/esm/vs/editor/common/services/editorBaseApi.js' {
  export { KeyMod } from 'monaco-editor';
}

declare module 'monaco-editor/esm/vs/base/common/uri.js' {
  export { Uri as URI } from 'monaco-editor';
}

declare module 'monaco-editor/esm/vs/editor/common/core/range.js' {
  export { Range } from 'monaco-editor';
}
