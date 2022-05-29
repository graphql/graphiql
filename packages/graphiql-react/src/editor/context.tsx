import { DocumentNode, OperationDefinitionNode } from 'graphql';
import { VariableToType } from 'graphql-language-service';
import { ReactNode, useMemo, useState } from 'react';

import { createContextHook, createNullableContext } from '../utility/context';
import { CodeMirrorEditor } from './types';

export type CodeMirrorEditorWithOperationFacts = CodeMirrorEditor & {
  documentAST: DocumentNode | null;
  operationName: string | null;
  operations: OperationDefinitionNode[] | null;
  variableToType: VariableToType | null;
};

export type EditorContextType = {
  headerEditor: CodeMirrorEditor | null;
  queryEditor: CodeMirrorEditorWithOperationFacts | null;
  responseEditor: CodeMirrorEditor | null;
  variableEditor: CodeMirrorEditor | null;
  setHeaderEditor(newEditor: CodeMirrorEditor): void;
  setQueryEditor(newEditor: CodeMirrorEditorWithOperationFacts): void;
  setResponseEditor(newEditor: CodeMirrorEditor): void;
  setVariableEditor(newEditor: CodeMirrorEditor): void;
};

export const EditorContext = createNullableContext<EditorContextType>(
  'EditorContext',
);

export function EditorContextProvider(props: { children: ReactNode }) {
  const [headerEditor, setHeaderEditor] = useState<CodeMirrorEditor | null>(
    null,
  );
  const [
    queryEditor,
    setQueryEditor,
  ] = useState<CodeMirrorEditorWithOperationFacts | null>(null);
  const [responseEditor, setResponseEditor] = useState<CodeMirrorEditor | null>(
    null,
  );
  const [variableEditor, setVariableEditor] = useState<CodeMirrorEditor | null>(
    null,
  );

  const value = useMemo<EditorContextType>(
    () => ({
      headerEditor,
      queryEditor,
      responseEditor,
      variableEditor,
      setHeaderEditor,
      setQueryEditor,
      setResponseEditor,
      setVariableEditor,
    }),
    [headerEditor, queryEditor, responseEditor, variableEditor],
  );

  return (
    <EditorContext.Provider value={value}>
      {props.children}
    </EditorContext.Provider>
  );
}

export const useEditorContext = createContextHook(EditorContext);
