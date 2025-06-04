import { FC, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { useEditorStore, editorStore } from '../stores';
import { EditorProps, SchemaReference } from '../types';
import { KEY_BINDINGS, VARIABLE_URI } from '../constants';
import {
  getOrCreateModel,
  createEditor,
  useChangeHandler,
  onEditorContainerKeyDown,
} from '../utility';

interface VariableEditorProps extends EditorProps {
  /**
   * Invoked when a reference to the GraphQL schema (type or field) is clicked
   * as part of the editor or one of its tooltips.
   * @param reference - The reference that has been clicked.
   */
  onClickReference?(reference: SchemaReference): void;

  /**
   * Invoked when the contents of the variables' editor change.
   * @param value - The new contents of the editor.
   */
  onEdit?(value: string): void;
}

export const VariableEditor: FC<VariableEditorProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO monaco
  onClickReference,
  onEdit,
  readOnly = false,
  ...props
}) => {
  const { initialVariables } = useEditorStore();
  const ref = useRef<HTMLDivElement>(null!);
  useChangeHandler(onEdit, STORAGE_KEY, 'variables');
  useEffect(() => {
    const { setEditor } = editorStore.getState();
    const model = getOrCreateModel({
      uri: VARIABLE_URI,
      value: initialVariables,
    });
    // Build the editor
    const editor = createEditor(ref, { model, readOnly });
    setEditor({ variableEditor: editor });
    // 2️⃣ Subscribe to content changes
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

export const STORAGE_KEY = 'variables';
