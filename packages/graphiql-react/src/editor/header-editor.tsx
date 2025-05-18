import { useEffect, useRef } from 'react';

import { commonKeys } from './common';
import { editorStore, storageStore, useEditorStore } from '../stores';
import { useChangeHandler, useSynchronizeOption } from './hooks';
import { WriteableEditorProps } from './types';
import { getOrCreateModel, HEADER_URI, KEY_BINDINGS } from '../constants';
import { clsx } from 'clsx';
import { createEditor } from '../create-editor';
import { debounce } from '../utility';
import type { IDisposable } from '../monaco-editor';

type HeaderEditorProps = WriteableEditorProps & {
  /**
   * Invoked when the contents of the headers editor change.
   * @param value The new contents of the editor.
   */
  onEdit?(value: string): void;
};

export function HeaderEditor({
  onEdit,
  readOnly = false,
  ...props
}: HeaderEditorProps) {
  const { initialHeaders, shouldPersistHeaders } = useEditorStore();
  const ref = useRef<HTMLDivElement>(null!);
  /*
  useEffect(() => {
    void importCodeMirrorImports().then(CodeMirror => {
      const container = ref.current;
      const newEditor = CodeMirror(container, {
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        extraKeys: commonKeys,
      });

      function showHint() {
        newEditor.showHint({ completeSingle: false, container });
      }

      newEditor.addKeyMap({
        'Cmd-Space': showHint,
        'Ctrl-Space': showHint,
        'Alt-Space': showHint,
        'Shift-Space': showHint,
      });

      newEditor.on('keyup', (editorInstance, event) => {
        const { code, key, shiftKey } = event;
        const isLetter = code.startsWith('Key');
        const isNumber = !shiftKey && code.startsWith('Digit');
        if (isLetter || isNumber || key === '_' || key === '"') {
          editorInstance.execCommand('autocomplete');
        }
      });
    });
  }, []);

  useChangeHandler(
    headerEditor,
    onEdit,
    shouldPersistHeaders ? STORAGE_KEY : null,
    'headers',
  );
  */
  useEffect(() => {
    const { setEditor, updateActiveTabValues } = editorStore.getState();
    // Build the editor
    const model = getOrCreateModel({ uri: HEADER_URI, value: initialHeaders });
    const editor = createEditor(ref, {
      model,
      readOnly,
    });
    setEditor({ headerEditor: editor });
    const disposables: IDisposable[] = [
      editor.addAction(KEY_BINDINGS.runQuery),
      editor.addAction(KEY_BINDINGS.prettify),
      editor.addAction(KEY_BINDINGS.mergeFragments),
      editor,
      model,
    ];

    if (shouldPersistHeaders) {
      const { storage } = storageStore.getState();
      // 2️⃣ Subscribe to content changes
      disposables.unshift(
        model.onDidChangeContent(
          debounce(500, () => {
            const value = model.getValue();
            storage.set(STORAGE_KEY, value);
            updateActiveTabValues({ headers: value });
          }),
        ),
      );
    }
    // 3️⃣ Clean‑up on unmount or when deps change
    return () => {
      for (const disposable of disposables) {
        disposable.dispose(); // remove the listener
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  return (
    <div
      ref={ref}
      {...props}
      className={clsx('graphiql-editor', props.className)}
    />
  );
}

export const STORAGE_KEY = 'headers';
