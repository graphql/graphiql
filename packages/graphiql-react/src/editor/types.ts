import type { editor } from '../monaco-editor';

export type CodeMirrorEditor = Editor & { options?: any };

export type WriteableEditorProps = {
  /**
   * Makes the editor read-only.
   * @default false
   */
  readOnly?: boolean;
};

export type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';

export type Editor = editor.IStandaloneCodeEditor;
