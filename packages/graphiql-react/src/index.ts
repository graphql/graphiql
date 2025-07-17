import './style/root.css';

export { useStorage, useTheme, type Theme } from './stores';

export * from './utility';
export type { TabsState } from './utility/tabs';
export * from './icons';
export * from './components';

export type {
  EditorProps,
  SchemaReference,
  SlicesWithActions,
  MonacoEditor,
} from './types';
export type { GraphiQLPlugin } from './stores/plugin';
export { KEY_MAP, formatShortcutForOS, isMacOs } from './constants';
export * from './deprecated';
