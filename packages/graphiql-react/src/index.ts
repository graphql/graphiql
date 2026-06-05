import './style/root.css';

export { useMonaco } from './stores';
export * from './utility';
export { Uri, KeyMod, KeyCode, Range } from './utility/monaco-ssr';
export {
  useGraphiQLSettings,
  SETTINGS_STORAGE_KEY,
} from './hooks/use-graphiql-settings';
export type {
  GraphiQLSettings,
  Theme as SettingsTheme,
  Density,
  FontSize,
} from './hooks/use-graphiql-settings';
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
export type { ResponseView } from './stores';
export { KEY_MAP, formatShortcutForOS, isMacOs } from './constants';
export * from './deprecated';
