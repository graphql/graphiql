import { editor } from 'monaco-editor';

export type CodeMirrorEditor = Editor & { options?: any };

export type CommonEditorProps = {
  /**
   * Sets the color theme you want to use for the editor.
   * @default 'graphiql'
   */
  editorTheme?: string;
};

export type WriteableEditorProps = CommonEditorProps & {
  /**
   * Makes the editor read-only.
   * @default false
   */
  readOnly?: boolean;
};

export type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';

export type Editor = editor.IStandaloneCodeEditor;
