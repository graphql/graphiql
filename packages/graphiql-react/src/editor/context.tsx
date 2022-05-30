import { DocumentNode, OperationDefinitionNode } from 'graphql';
import { VariableToType } from 'graphql-language-service';
import { ReactNode, useMemo, useState } from 'react';

import { useStorageContext } from '../storage';
import { createContextHook, createNullableContext } from '../utility/context';
import { STORAGE_KEY as STORAGE_KEY_HEADERS } from './header-editor';
import { useSynchronizeValue } from './hooks';
import { STORAGE_KEY_QUERY } from './query-editor';
import { CodeMirrorEditor } from './types';
import { STORAGE_KEY as STORAGE_KEY_VARIABLES } from './variable-editor';

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
  initialHeaders: string;
  initialQuery: string;
  initialVariables: string;
};

export const EditorContext = createNullableContext<EditorContextType>(
  'EditorContext',
);

type EditorContextProviderProps = {
  children: ReactNode;
  defaultQuery?: string;
  headers?: string;
  query?: string;
  variables?: string;
};

export function EditorContextProvider(props: EditorContextProviderProps) {
  const storage = useStorageContext();
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

  useSynchronizeValue(headerEditor, props.headers);
  useSynchronizeValue(queryEditor, props.query);
  useSynchronizeValue(variableEditor, props.variables);

  // We store this in state but never update it. By passing a function we only
  // need to compute it lazily during the initial render.
  const [initialValues] = useState(() => ({
    initialHeaders: props.headers ?? storage?.get(STORAGE_KEY_HEADERS) ?? '',
    initialQuery:
      props.query ??
      storage?.get(STORAGE_KEY_QUERY) ??
      props.defaultQuery ??
      DEFAULT_QUERY,
    initialVariables:
      props.variables ?? storage?.get(STORAGE_KEY_VARIABLES) ?? '',
  }));

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
      ...initialValues,
    }),
    [headerEditor, initialValues, queryEditor, responseEditor, variableEditor],
  );

  return (
    <EditorContext.Provider value={value}>
      {props.children}
    </EditorContext.Provider>
  );
}

export const useEditorContext = createContextHook(EditorContext);

const DEFAULT_QUERY = `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#     Merge Query:  Shift-Ctrl-M (or press the merge button above)
#
#       Run Query:  Ctrl-Enter (or press the play button above)
#
#   Auto Complete:  Ctrl-Space (or just start typing)
#

`;
