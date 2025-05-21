import { ComponentPropsWithoutRef } from 'react';
import type { editor as monacoEditor } from './monaco-editor';

export interface EditorProps extends ComponentPropsWithoutRef<'div'> {
  /**
   * Makes the editor read-only.
   * @default false
   */
  readOnly?: boolean;
}

export type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';

export type MonacoEditor = monacoEditor.IStandaloneCodeEditor;
