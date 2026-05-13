import './style/root.css';

export { useMonaco } from './stores';
export * from './utility';
export { Uri, KeyMod, KeyCode, Range } from './utility/monaco-ssr';
export type { TabsState } from './utility/tabs';
export * from './icons';
export * from './components';

export type {
  EditorProps,
  SchemaReference,
  SlicesWithActions,
  MonacoEditor,
  Theme,
} from './types';
export type { GraphiQLPlugin } from './stores/plugin';
export { KEY_MAP, formatShortcutForOS, isMacOs } from './constants';
export * from './deprecated';
