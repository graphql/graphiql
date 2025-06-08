import { ComponentPropsWithoutRef } from 'react';
import { AllTypeInfo } from 'graphql-language-service/esm/types';
import type { editor as monacoEditor } from './monaco-editor';
import {
  EditorSlice,
  ExecutionSlice,
  PluginSlice,
  SchemaSlice,
} from './stores';
import { RuleKind } from 'graphql-language-service';

export type EditorProps = ComponentPropsWithoutRef<'div'>;

export interface SchemaReference {
  kind: RuleKind;
  typeInfo: AllTypeInfo;
}

export type MonacoEditor = monacoEditor.IStandaloneCodeEditor;

export type AllSlices = EditorSlice &
  ExecutionSlice &
  PluginSlice &
  SchemaSlice;
