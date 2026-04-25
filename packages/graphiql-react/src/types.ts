import type { ComponentPropsWithoutRef } from 'react';
import type { AllTypeInfo } from 'graphql-language-service/esm/types';
import type * as monaco from 'monaco-editor';
import type {
  EditorSlice,
  ExecutionSlice,
  PluginSlice,
  SchemaSlice,
  ThemeSlice,
  StorageSlice,
  //
  EditorActions,
  ExecutionActions,
  PluginActions,
  SchemaActions,
  ThemeActions,
} from './stores';
import type { RuleKind } from 'graphql-language-service';

export type EditorProps = ComponentPropsWithoutRef<'div'>;

export interface SchemaReference {
  kind: RuleKind;
  typeInfo: AllTypeInfo;
}

export type MonacoEditor = monaco.editor.IStandaloneCodeEditor;

export type AllSlices = EditorSlice &
  ExecutionSlice &
  PluginSlice &
  SchemaSlice &
  ThemeSlice &
  StorageSlice;

export type AllActions = EditorActions &
  ExecutionActions &
  PluginActions &
  SchemaActions &
  ThemeActions;

export interface SlicesWithActions extends AllSlices {
  actions: AllActions;
}

/**
 * The value `null` semantically means that the user does not explicitly choose
 * any theme, so we use the system default.
 */
export type Theme = 'light' | 'dark' | null;
