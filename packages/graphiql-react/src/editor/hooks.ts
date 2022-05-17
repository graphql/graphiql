import { Editor, EditorChange } from 'codemirror';
import { RefObject, useEffect, useRef } from 'react';

import onHasCompletion from './completion';

export function useSynchronizeValue(
  editor: Editor | null,
  value: string | undefined,
) {
  useEffect(() => {
    if (editor && typeof value !== 'undefined') {
      if (value !== editor.getValue()) {
        editor.setValue(value);
      }
    }
  }, [editor, value]);
}

export type EditCallback = (value: string) => void;

export function useChangeHandler(
  editor: Editor | null,
  callback: EditCallback | undefined,
) {
  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleChange = (editorInstance: Editor) => {
      const newValue = editorInstance.getValue();
      callback?.(newValue);
    };
    editor.on('change', handleChange);
    return () => editor.off('change', handleChange);
  }, [editor, callback]);
}

export type CompletionCallback = (value: HTMLDivElement) => void;

export function useCompletion(
  editor: Editor | null,
  callback: CompletionCallback | undefined,
) {
  useEffect(() => {
    if (editor && callback) {
      const handleCompletion = (instance: Editor, changeObj?: EditorChange) => {
        onHasCompletion(instance, changeObj, callback);
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
    }
  }, [editor, callback]);
}

export type EmptyCallback = () => void;

export function useKeyMap(
  editor: Editor | null,
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
  editor: Editor | null,
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
