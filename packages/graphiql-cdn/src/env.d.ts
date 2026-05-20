/// <reference types="vite/client" />
declare module '*.css';

declare namespace globalThis {
  import type * as monaco from 'monaco-editor';
  var MonacoEnvironment: monaco.Environment | undefined;
}
