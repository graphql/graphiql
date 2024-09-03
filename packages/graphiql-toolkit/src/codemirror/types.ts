import type { Editor } from 'codemirror';
import { DocumentNode, OperationDefinitionNode } from 'graphql';
import { VariableToType } from 'graphql-language-service';

export type CodeMirrorType = typeof import('codemirror');

export type CodeMirrorEditor = Editor & { options?: any };

export type KeyMap = 'sublime' | 'emacs' | 'vim';

export type CommonEditorProps = {
  /**
   * Sets the color theme you want to use for the editor.
   * @default 'graphiql'
   */
  editorTheme?: string;
  /**
   * Sets the key map to use when using the editor.
   * @default 'sublime'
   * @see {@link https://codemirror.net/5/doc/manual.html#keymaps}
   */
  keyMap?: KeyMap;
};

export type WriteableEditorProps = CommonEditorProps & {
  /**
   * Makes the editor read-only.
   * @default false
   */
  readOnly?: boolean;
};

export type CodeMirrorEditorWithOperationFacts = CodeMirrorEditor & {
  documentAST: DocumentNode | null;
  operationName: string | null;
  operations: OperationDefinitionNode[] | null;
  variableToType: VariableToType | null;
};
