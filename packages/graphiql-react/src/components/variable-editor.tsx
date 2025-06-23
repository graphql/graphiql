import { FC, useEffect, useRef } from 'react';
import { useGraphiQL, useGraphiQLActions } from './provider';
import type { EditorProps } from '../types';
import { KEY_BINDINGS, VARIABLE_URI } from '../constants';
import {
  getOrCreateModel,
  createEditor,
  debounce,
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
  const { setEditor, run, prettifyEditors, mergeQuery, updateActiveTabValues } =
    useGraphiQLActions();
  const initialVariables = useGraphiQL(state => state.initialVariables);
  const ref = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    const model = getOrCreateModel({
      uri: VARIABLE_URI,
      value: initialVariables,
    });
    const editor = createEditor(ref, { model });
    setEditor({ variableEditor: editor });
    const handleChange = debounce(100, () => {
      const value = model.getValue();
      updateActiveTabValues({ variables: value });
      onEdit?.(value);
    });
    const disposables = [
      model.onDidChangeContent(handleChange),
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
