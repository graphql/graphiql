import { FC, useEffect, useRef } from 'react';
import { useGraphiQL } from './provider';
import { EditorProps, SchemaReference } from '../types';
import { KEY_BINDINGS, VARIABLE_URI } from '../constants';
import {
  getOrCreateModel,
  createEditor,
  useChangeHandler,
  onEditorContainerKeyDown,
  pick,
  cleanupDisposables,
  cn,
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
  const { initialVariables, setEditor, run, prettifyEditors, mergeQuery } =
    useGraphiQL(
      pick(
        'initialVariables',
        'setEditor',
        'run',
        'prettifyEditors',
        'mergeQuery',
      ),
    );
  const ref = useRef<HTMLDivElement>(null!);
  useChangeHandler(onEdit, STORAGE_KEY, 'variables');
  useEffect(() => {
    const model = getOrCreateModel({
      uri: VARIABLE_URI,
      value: initialVariables,
    });
    // Build the editor
    const editor = createEditor(ref, { model, readOnly });
    setEditor({ variableEditor: editor });
    // 2️⃣ Subscribe to content changes
    const disposables = [
      editor.addAction({ ...KEY_BINDINGS.runQuery, run }),
      editor.addAction({ ...KEY_BINDINGS.prettify, run: prettifyEditors }),
      editor.addAction({ ...KEY_BINDINGS.mergeFragments, run: mergeQuery }),
      editor,
      model,
    ];
    return cleanupDisposables(disposables);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={onEditorContainerKeyDown}
      {...props}
      className={cn('graphiql-editor', props.className)}
    />
  );
};

export const STORAGE_KEY = 'variables';
