import type { editor } from '../monaco-editor';
import { HTMLAttributes } from 'react';

export type CodeMirrorEditor = Editor & { options?: any };

export type CommonEditorProps = HTMLAttributes<HTMLDivElement>;

export interface WriteableEditorProps extends CommonEditorProps {
  /**
   * Makes the editor read-only.
   * @default false
   */
  readOnly?: boolean;
}

export type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';

export type Editor = editor.IStandaloneCodeEditor;
