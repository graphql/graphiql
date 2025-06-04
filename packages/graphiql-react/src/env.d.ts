declare namespace globalThis {
  import * as monaco from './monaco-editor';
  var MonacoEnvironment: monaco.Environment;
  // Needs for cypress
  var __MONACO = monaco;
}
