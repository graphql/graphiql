// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type * as monaco from 'monaco-editor';

declare global {
  interface Window {
    __MONACO: typeof monaco;
  }
}
