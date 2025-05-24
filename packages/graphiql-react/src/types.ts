import { ComponentPropsWithoutRef } from 'react';
import { AllTypeInfo } from 'graphql-language-service/esm/types';
import type { editor as monacoEditor } from './monaco-editor';

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
