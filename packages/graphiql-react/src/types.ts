import type { editor } from './monaco-editor';
import { HTMLAttributes } from 'react';

export interface EditorProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Makes the editor read-only.
   * @default false
   */
  readOnly?: boolean;
}

export type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';

export type MonacoEditor = editor.IStandaloneCodeEditor;
