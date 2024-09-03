import {
  StorageAPI,
  CodeMirrorEditorWithOperationFacts,
  CodeMirrorEditor,
  synchronizeActiveTabValues,
  serializeTabState,
  TabsState,
  TabState,
} from '@graphiql/toolkit';
import { useCallback, useMemo } from 'react';

import { debounce } from '@graphiql/toolkit';

export function useSynchronizeActiveTabValues({
  queryEditor,
  variableEditor,
  headerEditor,
  responseEditor,
}: {
  queryEditor: CodeMirrorEditorWithOperationFacts | null;
  variableEditor: CodeMirrorEditor | null;
  headerEditor: CodeMirrorEditor | null;
  responseEditor: CodeMirrorEditor | null;
}) {
  return useCallback<(state: TabsState) => TabsState>(
    state => {
      return synchronizeActiveTabValues({
        currentState: state,
        queryEditor,
        variableEditor,
        headerEditor,
        responseEditor,
      });
    },
    [queryEditor, variableEditor, headerEditor, responseEditor],
  );
}

export function useSetEditorValues({
  queryEditor,
  variableEditor,
  headerEditor,
  responseEditor,
  defaultHeaders,
}: {
  queryEditor: CodeMirrorEditorWithOperationFacts | null;
  variableEditor: CodeMirrorEditor | null;
  headerEditor: CodeMirrorEditor | null;
  responseEditor: CodeMirrorEditor | null;
  defaultHeaders?: string;
}) {
  return useCallback(
    ({
      query,
      variables,
      headers,
      response,
    }: {
      query: string | null;
      variables?: string | null;
      headers?: string | null;
      response: string | null;
    }) => {
      queryEditor?.setValue(query ?? '');
      variableEditor?.setValue(variables ?? '');
      headerEditor?.setValue(headers ?? defaultHeaders ?? '');
      responseEditor?.setValue(response ?? '');
    },
    [headerEditor, queryEditor, responseEditor, variableEditor, defaultHeaders],
  );
}
