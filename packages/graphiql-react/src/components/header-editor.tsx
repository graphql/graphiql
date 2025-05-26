import { FC, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { editorStore, useEditorStore } from '../stores';
import { EditorProps } from '../types';
import { HEADER_URI, KEY_BINDINGS } from '../constants';
import {
  getOrCreateModel,
  createEditor,
  useChangeHandler,
  onEditorContainerKeyDown,
} from '../utility';

interface HeaderEditorProps extends EditorProps {
  /**
   * Invoked when the contents of the headers editor change.
   * @param value The new contents of the editor.
   */
  onEdit?(value: string): void;
}

export const HeaderEditor: FC<HeaderEditorProps> = ({
  onEdit,
  readOnly = false,
  ...props
}) => {
  const { initialHeaders, shouldPersistHeaders } = useEditorStore();
  const ref = useRef<HTMLDivElement>(null!);
  useChangeHandler(
    onEdit,
    shouldPersistHeaders ? STORAGE_KEY : null,
    'headers',
  );
  useEffect(() => {
    const { setEditor } = editorStore.getState();
    const model = getOrCreateModel({ uri: HEADER_URI, value: initialHeaders });
    // Build the editor
    const editor = createEditor(ref, { model, readOnly });
    setEditor({ headerEditor: editor });
    const disposables = [
      editor.addAction(KEY_BINDINGS.runQuery),
      editor.addAction(KEY_BINDINGS.prettify),
      editor.addAction(KEY_BINDINGS.mergeFragments),
      editor,
      model,
    ];
    // 3️⃣ Clean‑up on unmount
    return () => {
      for (const disposable of disposables) {
        disposable.dispose(); // remove the listener
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={onEditorContainerKeyDown}
      {...props}
      className={clsx('graphiql-editor', props.className)}
    />
  );
};

export const STORAGE_KEY = 'headers';
