declare namespace globalThis {
  var MonacoEnvironment: import('monaco-editor').Environment;
  var __MONACO: typeof import('monaco-graphql/monaco-editor');
}

declare module 'monaco-editor/editor/common/standalone/standaloneEnums.js' {
  export { KeyCode } from 'monaco-graphql/monaco-editor';
}

declare module 'monaco-editor/editor/common/services/editorBaseApi.js' {
  export { KeyMod } from 'monaco-graphql/monaco-editor';
}

declare module 'monaco-editor/base/common/uri.js' {
  export { Uri as URI } from 'monaco-graphql/monaco-editor';
}

declare module 'monaco-editor/editor/common/core/range.js' {
  export { Range } from 'monaco-graphql/monaco-editor';
}

declare module 'https://esm.sh/monaco-graphql/esm/graphql.worker.js?worker&deps=monaco-editor@0.57.0' {
  type WorkerCtor = typeof import('*?worker').default; // reuse type from vite/client

  const workerConstructor: WorkerCtor;
  export default workerConstructor;
}
