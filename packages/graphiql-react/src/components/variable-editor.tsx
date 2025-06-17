import { FC, useEffect, useRef } from 'react';
import { useGraphiQL, useGraphiQLActions } from './provider';
import type { EditorProps } from '../types';
import { KEY_BINDINGS, STORAGE_KEY, VARIABLE_URI } from '../constants';
import {
  getOrCreateModel,
  createEditor,
  useChangeHandler,
  onEditorContainerKeyDown,
  cleanupDisposables,
  cn,
} from '../utility';

interface VariableEditorProps extends EditorProps {
  /**
   * Invoked when the contents of the variables' editor change.
   * @param value - The new contents of the editor.
   */
  onEdit?(value: string): void;
}

export const VariableEditor: FC<VariableEditorProps> = ({
  onEdit,
  ...props
}) => {
  const { setEditor, run, prettifyEditors, mergeQuery } = useGraphiQLActions();
  const initialVariables = useGraphiQL(state => state.initialVariables);
  const ref = useRef<HTMLDivElement>(null!);
  useChangeHandler(onEdit, STORAGE_KEY.variables, 'variables');
  useEffect(() => {
    const model = getOrCreateModel({
      uri: VARIABLE_URI,
      value: initialVariables,
    });
    const editor = createEditor(ref, { model });
    setEditor({ variableEditor: editor });
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
