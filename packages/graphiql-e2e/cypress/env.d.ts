import type * as monaco from 'monaco-editor';

declare global {
  interface Window {
    __MONACO: typeof monaco;
  }
}
