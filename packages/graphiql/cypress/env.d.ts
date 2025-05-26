// eslint-disable-next-line import-x/no-extraneous-dependencies
import * as monaco from 'monaco-editor';

declare global {
  interface Window {
    __MONACO: typeof monaco;
  }
}
