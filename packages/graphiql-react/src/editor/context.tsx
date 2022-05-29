import { fillLeafs, GetDefaultFieldNamesFn } from '@graphiql/toolkit';
import { DocumentNode, OperationDefinitionNode } from 'graphql';
import { VariableToType } from 'graphql-language-service';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { useSchemaContext } from '../schema';

import { createContextHook, createNullableContext } from '../utility/context';
import { useCopyQuery, useMergeQuery, usePrettifyEditors } from './hooks';
import { CodeMirrorEditor } from './types';

export type CodeMirrorEditorWithOperationFacts = CodeMirrorEditor & {
  documentAST: DocumentNode | null;
  operationName: string | null;
  operations: OperationDefinitionNode[] | null;
  variableToType: VariableToType | null;
};

export type EditorContextType = {
  autoCompleteLeafs(): string | undefined;
  copy(): void;
  merge(): void;
  prettify(): void;
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

type EditorContextProviderProps = {
  children: ReactNode;
  getDefaultFieldNames?: GetDefaultFieldNamesFn;
  onCopyQuery?(query: string): void;
};

export function EditorContextProvider(props: EditorContextProviderProps) {
  const { schema } = useSchemaContext({
    nonNull: true,
    caller: EditorContextProvider,
  });
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

  const autoCompleteLeafs = useCallback<
    EditorContextType['autoCompleteLeafs']
  >(() => {
    if (!queryEditor) {
      return;
    }

    const query = queryEditor.getValue();
    const { insertions, result } = fillLeafs(
      schema,
      query,
      props.getDefaultFieldNames,
    );
    if (insertions && insertions.length > 0) {
      queryEditor.operation(() => {
        const cursor = queryEditor.getCursor();
        const cursorIndex = queryEditor.indexFromPos(cursor);
        queryEditor.setValue(result || '');
        let added = 0;
        const markers = insertions.map(({ index, string }) =>
          queryEditor.markText(
            queryEditor.posFromIndex(index + added),
            queryEditor.posFromIndex(index + (added += string.length)),
            {
              className: 'autoInsertedLeaf',
              clearOnEnter: true,
              title: 'Automatically added leaf fields',
            },
          ),
        );
        setTimeout(() => markers.forEach(marker => marker.clear()), 7000);
        let newCursorIndex = cursorIndex;
        insertions.forEach(({ index, string }) => {
          if (index < cursorIndex) {
            newCursorIndex += string.length;
          }
        });
        queryEditor.setCursor(queryEditor.posFromIndex(newCursorIndex));
      });
    }

    return result;
  }, [props.getDefaultFieldNames, queryEditor, schema]);

  const copy = useCopyQuery({ queryEditor, onCopyQuery: props.onCopyQuery });

  const merge = useMergeQuery({ queryEditor, schema });

  const prettify = usePrettifyEditors({
    queryEditor,
    variableEditor,
    headerEditor,
  });

  const value = useMemo<EditorContextType>(
    () => ({
      autoCompleteLeafs,
      copy,
      merge,
      prettify,
      headerEditor,
      queryEditor,
      responseEditor,
      variableEditor,
      setHeaderEditor,
      setQueryEditor,
      setResponseEditor,
      setVariableEditor,
    }),
    [
      autoCompleteLeafs,
      copy,
      merge,
      prettify,
      headerEditor,
      queryEditor,
      responseEditor,
      variableEditor,
    ],
  );

  return (
    <EditorContext.Provider value={value}>
      {props.children}
    </EditorContext.Provider>
  );
}

export const useEditorContext = createContextHook(EditorContext);
