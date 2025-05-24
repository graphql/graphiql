import type { editor, Uri } from 'monaco-editor';

declare global {
  interface Window {
    __MONACO_EDITOR: typeof editor;
    __MONACO_URI: typeof Uri;
  }
}
