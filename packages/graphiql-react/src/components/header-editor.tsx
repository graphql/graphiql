import { FC, useEffect, useRef } from 'react';
import { useGraphiQL, useGraphiQLActions } from './provider';
import type { EditorProps } from '../types';
import { HEADER_URI, KEY_BINDINGS } from '../constants';
import {
  getOrCreateModel,
  createEditor,
  debounce,
  onEditorContainerKeyDown,
  cleanupDisposables,
  cn,
} from '../utility';

interface HeaderEditorProps extends EditorProps {
  /**
   * Invoked when the contents of the headers editor change.
   * @param value - The new contents of the editor.
   */
  onEdit?(value: string): void;
}

export const HeaderEditor: FC<HeaderEditorProps> = ({ onEdit, ...props }) => {
  const { setEditor, run, prettifyEditors, mergeQuery, updateActiveTabValues } =
    useGraphiQLActions();
  const initialHeaders = useGraphiQL(state => state.initialHeaders);
  const ref = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    const model = getOrCreateModel({ uri: HEADER_URI, value: initialHeaders });
    const editor = createEditor(ref, { model });
    setEditor({ headerEditor: editor });
    const updateTab = debounce(100, (headers: string) => {
      updateActiveTabValues({ headers });
    });
    const disposables = [
      model.onDidChangeContent(() => {
        const newValue = model.getValue();
        updateTab(newValue);
        onEdit?.(newValue);
      }),
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
