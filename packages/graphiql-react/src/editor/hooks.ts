import { EditorChange } from 'codemirror';
import { RefObject, useContext, useEffect, useRef } from 'react';
import { ExplorerContext } from '../explorer';
import { useSchemaWithError } from '../schema';

import { StorageContext } from '../storage';
import debounce from '../utility/debounce';

import { onHasCompletion } from './completion';
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
