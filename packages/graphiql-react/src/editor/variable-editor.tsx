import { useEffect, useRef } from 'react';
import { useEditorStore, storageStore, editorStore } from '../stores';
import { useChangeHandler } from './hooks';
import { WriteableEditorProps, SchemaReference } from './types';
import { KEY_BINDINGS, VARIABLE_URI } from '../constants';
import { clsx } from 'clsx';
import { debounce, getOrCreateModel, createEditor } from '../utility';

type VariableEditorProps = WriteableEditorProps & {
  /**
   * Invoked when a reference to the GraphQL schema (type or field) is clicked
   * as part of the editor or one of its tooltips.
   * @param reference The reference that has been clicked.
   */
  onClickReference?(reference: SchemaReference): void;
  /**
   * Invoked when the contents of the variables' editor change.
   * @param value The new contents of the editor.
   */
  onEdit?(value: string): void;
};

export function VariableEditor({
  onClickReference,
  onEdit,
  readOnly = false,
  ...props
}: VariableEditorProps) {
  const { initialVariables } = useEditorStore();
  const ref = useRef<HTMLDivElement>(null!);
  /*
  useChangeHandler(variableEditor, onEdit, STORAGE_KEY, 'variables');
  */
  useEffect(() => {
    const { setEditor, updateActiveTabValues } = editorStore.getState();
    const model = getOrCreateModel({
      uri: VARIABLE_URI,
      value: initialVariables,
    });
    // Build the editor
    const editor = createEditor(ref, { model, readOnly });
    setEditor({ variableEditor: editor });
    const { storage } = storageStore.getState();
    // 2️⃣ Subscribe to content changes
    const disposables = [
      model.onDidChangeContent(
        debounce(500, () => {
          const value = model.getValue();
          console.log('storage', storage);
          storage.set(STORAGE_KEY, value);
          updateActiveTabValues({ variables: value });
        }),
      ),
      editor.addAction(KEY_BINDINGS.runQuery),
      editor.addAction(KEY_BINDINGS.prettify),
      editor.addAction(KEY_BINDINGS.mergeFragments),
      editor,
      model,
    ];

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

export const STORAGE_KEY = 'variables';
