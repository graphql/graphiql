import { ComponentPropsWithoutRef } from 'react';
import { AllTypeInfo } from 'graphql-language-service/esm/types';
import type { editor as monacoEditor } from './monaco-editor';
import {
  EditorSlice,
  ExecutionSlice,
  PluginSlice,
  SchemaSlice,
} from './stores';

export interface EditorProps extends ComponentPropsWithoutRef<'div'> {
  /**
   * Makes the editor read-only.
   * @default false
   */
  readOnly?: boolean;
}

export interface SchemaReference {
  kind: string;
  typeInfo: AllTypeInfo;
}

export type MonacoEditor = monacoEditor.IStandaloneCodeEditor;

type OverlapError<K extends PropertyKey> = {
  ERROR: 'Conflicting keys found';
  CONFLICT_KEYS: K;
};

type MergeWithoutOverlap<A, B> = keyof A & keyof B extends never
  ? A & B
  : OverlapError<keyof A & keyof B>;

type MergeMany<T extends any[], Acc = unknown> = T extends [
  infer Head,
  ...infer Tail,
]
  ? MergeWithoutOverlap<Acc, Head> extends infer Merged
    ? Merged extends OverlapError<any>
      ? Merged
      : MergeMany<Tail, Merged>
    : never
  : Acc;

export type AllSlices = MergeMany<
  [
    //
    EditorSlice,
    ExecutionSlice,
    PluginSlice,
    SchemaSlice,
  ]
>;
