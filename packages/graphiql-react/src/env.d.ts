declare namespace globalThis {
  import type { Environment, editor, Uri } from './monaco-editor';
  var MonacoEnvironment: Environment;
  // Needs for cypress
  var __MONACO_EDITOR: typeof editor;

  var __MONACO_URI: typeof Uri;
}
