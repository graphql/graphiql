import { mergeAst } from '@graphiql/toolkit';
import { EditorChange } from 'codemirror';
import copyToClipboard from 'copy-to-clipboard';
import { GraphQLSchema, parse, print } from 'graphql';
import { RefObject, useCallback, useContext, useEffect, useRef } from 'react';

import { ExplorerContext } from '../explorer';
import { useSchemaWithError } from '../schema';
import { StorageContext } from '../storage';
import debounce from '../utility/debounce';
import { onHasCompletion } from './completion';
import { CodeMirrorEditorWithOperationFacts } from './context';
import { CodeMirrorEditor } from './types';

export function useSynchronizeValue(
  editor: CodeMirrorEditor | null,
  value: string | undefined,
) {
  useEffect(() => {
    if (editor && typeof value !== 'undefined' && value !== editor.getValue()) {
      editor.setValue(value);
    }
  }, [editor, value]);
}

export type EditCallback = (value: string) => void;

export function useChangeHandler(
  editor: CodeMirrorEditor | null,
  callback: EditCallback | undefined,
  storageKey: string | null,
) {
  const storage = useContext(StorageContext);
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

    const handleChange = (editorInstance: CodeMirrorEditor) => {
      const newValue = editorInstance.getValue();
      callback?.(newValue);
      store(newValue);
    };
    editor.on('change', handleChange);
    return () => editor.off('change', handleChange);
  }, [callback, editor, storage, storageKey]);
}

export function useCompletion(editor: CodeMirrorEditor | null) {
  const { schema } = useSchemaWithError('hook', 'useCompletion');
  const explorer = useContext(ExplorerContext);
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

export type EmptyCallback = () => void;

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

export function useResizeEditor(
  editor: CodeMirrorEditor | null,
  ref: RefObject<HTMLDivElement>,
) {
  const sizeRef = useRef<number>();
  useEffect(() => {
    if (!ref.current || !editor) {
      return;
    }
    const size = ref.current.clientHeight;
    if (size !== sizeRef.current) {
      editor.setSize(null, null); // TODO: added the args here. double check no effects. might be version issue
    }
    sizeRef.current = size;
  });
}

export function useCopyQuery({
  queryEditor,
  onCopyQuery,
}: {
  queryEditor: CodeMirrorEditorWithOperationFacts | null;
  onCopyQuery?(query: string): void;
}) {
  return useCallback(() => {
    if (!queryEditor) {
      return;
    }

    const query = queryEditor.getValue();
    copyToClipboard(query);

    onCopyQuery?.(query);
  }, [queryEditor, onCopyQuery]);
}

export function useMergeQuery({
  queryEditor,
  schema,
}: {
  queryEditor?: CodeMirrorEditorWithOperationFacts | null;
  schema: GraphQLSchema | null | undefined;
}) {
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
  queryEditor,
  variableEditor,
  headerEditor,
}: {
  queryEditor: CodeMirrorEditorWithOperationFacts | null;
  variableEditor: CodeMirrorEditor | null;
  headerEditor: CodeMirrorEditor | null;
}) {
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
