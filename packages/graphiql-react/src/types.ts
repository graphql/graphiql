import type { ComponentPropsWithoutRef } from 'react';
import type { AllTypeInfo } from 'graphql-language-service/esm/types';
import type * as monaco from 'monaco-editor';
import type {
  EditorSlice,
  ExecutionSlice,
  PluginSlice,
  SchemaSlice,
  //
  EditorActions,
  ExecutionActions,
  PluginActions,
  SchemaActions,
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
  SchemaSlice;

export type AllActions = EditorActions &
  ExecutionActions &
  PluginActions &
  SchemaActions;

export interface SlicesWithActions extends AllSlices {
  actions: AllActions;
}
