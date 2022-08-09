import { fillLeafs, GetDefaultFieldNamesFn, mergeAst } from '@graphiql/toolkit';
import type { EditorChange, EditorConfiguration } from 'codemirror';
import copyToClipboard from 'copy-to-clipboard';
import { parse, print } from 'graphql';
import { useCallback, useEffect } from 'react';

import { useExplorerContext } from '../explorer';
import { useSchemaContext } from '../schema';
import { useStorageContext } from '../storage';
import debounce from '../utility/debounce';
import { onHasCompletion } from './completion';
import { useEditorContext } from './context';
import { CodeMirrorEditor } from './types';

export function useSynchronizeValue(
  editor: CodeMirrorEditor | null,
  value: string | undefined,
) {
  useEffect(() => {
    if (editor && typeof value === 'string' && value !== editor.getValue()) {
      editor.setValue(value);
    }
  }, [editor, value]);
}

export function useSynchronizeOption<K extends keyof EditorConfiguration>(
  editor: CodeMirrorEditor | null,
  option: K,
  value: EditorConfiguration[K],
) {
  useEffect(() => {
    if (editor) {
      editor.setOption(option, value);
    }
  }, [editor, option, value]);
}

export type EditCallback = (value: string) => void;

export function useChangeHandler(
  editor: CodeMirrorEditor | null,
  callback: EditCallback | undefined,
  storageKey: string | null,
  tabProperty: 'variables' | 'headers',
  caller: Function,
) {
  const { updateActiveTabValues } = useEditorContext({ nonNull: true, caller });
  const storage = useStorageContext();

  useEffect(() => {
    if (!editor) {
      return;
    }

    const store = debounce(500, (value: string) => {
      if (!storage || storageKey === null) {
        return;
      }
      storage.set(storageKey, value);
    });

    const updateTab = debounce(100, (value: string) => {
      updateActiveTabValues({ [tabProperty]: value });
    });

    const handleChange = (
      editorInstance: CodeMirrorEditor,
      changeObj: EditorChange | undefined,
    ) => {
      // When we signal a change manually without actually changing anything
      // we don't want to invoke the callback.
      if (!changeObj) {
        return;
      }

      const newValue = editorInstance.getValue();
      store(newValue);
      updateTab(newValue);
      callback?.(newValue);
    };
    editor.on('change', handleChange);
    return () => editor.off('change', handleChange);
  }, [
    callback,
    editor,
    storage,
    storageKey,
    tabProperty,
    updateActiveTabValues,
  ]);
}

export function useCompletion(
  editor: CodeMirrorEditor | null,
  caller: Function,
) {
  const { schema } = useSchemaContext({ nonNull: true, caller });
  const explorer = useExplorerContext();
  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleCompletion = (
      instance: CodeMirrorEditor,
      changeObj?: EditorChange,
    ) => {
      onHasCompletion(instance, changeObj, schema, explorer);
    };
    editor.on(
      // @ts-expect-error @TODO additional args for hasCompletion event
      'hasCompletion',
      handleCompletion,
    );
    return () =>
      editor.off(
        // @ts-expect-error @TODO additional args for hasCompletion event
        'hasCompletion',
        handleCompletion,
      );
  }, [editor, explorer, schema]);
}

type EmptyCallback = () => void;

export function useKeyMap(
  editor: CodeMirrorEditor | null,
  keys: string[],
  callback: EmptyCallback | undefined,
) {
  useEffect(() => {
    if (!editor) {
      return;
    }
    for (const key of keys) {
      editor.removeKeyMap(key);
    }

    if (callback) {
      const keyMap: Record<string, EmptyCallback> = {};
      for (const key of keys) {
        keyMap[key] = () => callback();
      }
      editor.addKeyMap(keyMap);
    }
  }, [editor, keys, callback]);
}

export type CopyQueryCallback = (query: string) => void;

export function useCopyQuery({
  caller,
  onCopyQuery,
}: {
  caller?: Function;
  onCopyQuery?: CopyQueryCallback;
} = {}) {
  const { queryEditor } = useEditorContext({
    nonNull: true,
    caller: caller || useCopyQuery,
  });
  return useCallback(() => {
    if (!queryEditor) {
      return;
    }

    const query = queryEditor.getValue();
    copyToClipboard(query);

    onCopyQuery?.(query);
  }, [queryEditor, onCopyQuery]);
}

export function useMergeQuery({ caller }: { caller?: Function } = {}) {
  const { queryEditor } = useEditorContext({
    nonNull: true,
    caller: caller || useMergeQuery,
  });
  const { schema } = useSchemaContext({ nonNull: true, caller: useMergeQuery });
  return useCallback(() => {
    const documentAST = queryEditor?.documentAST;
    const query = queryEditor?.getValue();
    if (!documentAST || !query) {
      return;
    }

    queryEditor.setValue(print(mergeAst(documentAST, schema)));
  }, [queryEditor, schema]);
}

export function usePrettifyEditors({
  caller,
}: {
  caller?: Function;
} = {}) {
  const { queryEditor, headerEditor, variableEditor } = useEditorContext({
    nonNull: true,
    caller: caller || usePrettifyEditors,
  });
  return useCallback(() => {
    if (variableEditor) {
      const variableEditorContent = variableEditor.getValue();
      try {
        const prettifiedVariableEditorContent = JSON.stringify(
          JSON.parse(variableEditorContent),
          null,
          2,
        );
        if (prettifiedVariableEditorContent !== variableEditorContent) {
          variableEditor.setValue(prettifiedVariableEditorContent);
        }
      } catch {
        /* Parsing JSON failed, skip prettification */
      }
    }

    if (headerEditor) {
      const headerEditorContent = headerEditor.getValue();

      try {
        const prettifiedHeaderEditorContent = JSON.stringify(
          JSON.parse(headerEditorContent),
          null,
          2,
        );
        if (prettifiedHeaderEditorContent !== headerEditorContent) {
          headerEditor.setValue(prettifiedHeaderEditorContent);
        }
      } catch {
        /* Parsing JSON failed, skip prettification */
      }
    }

    if (queryEditor) {
      const editorContent = queryEditor.getValue();
      const prettifiedEditorContent = print(parse(editorContent));

      if (prettifiedEditorContent !== editorContent) {
        queryEditor.setValue(prettifiedEditorContent);
      }
    }
  }, [queryEditor, variableEditor, headerEditor]);
}

export function useAutoCompleteLeafs({
  getDefaultFieldNames,
  caller,
}: { getDefaultFieldNames?: GetDefaultFieldNamesFn; caller?: Function } = {}) {
  const { schema } = useSchemaContext({
    nonNull: true,
    caller: caller || useAutoCompleteLeafs,
  });
  const { queryEditor } = useEditorContext({
    nonNull: true,
    caller: caller || useAutoCompleteLeafs,
  });
  return useCallback(() => {
    if (!queryEditor) {
      return;
    }

    const query = queryEditor.getValue();
    const { insertions, result } = fillLeafs(
      schema,
      query,
      getDefaultFieldNames,
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
  }, [getDefaultFieldNames, queryEditor, schema]);
}
