import { FC, useEffect, useRef } from 'react';
import { useGraphiQL, useGraphiQLActions } from './provider';
import type { EditorProps } from '../types';
import { HEADER_URI, KEY_BINDINGS, STORAGE_KEY } from '../constants';
import {
  getOrCreateModel,
  createEditor,
  useChangeHandler,
  onEditorContainerKeyDown,
  pick,
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
  const { setEditor, run, prettifyEditors, mergeQuery } = useGraphiQLActions();
  const { initialHeaders, shouldPersistHeaders } = useGraphiQL(
    pick('initialHeaders', 'shouldPersistHeaders'),
  );
  const ref = useRef<HTMLDivElement>(null!);
  useChangeHandler(
    onEdit,
    shouldPersistHeaders ? STORAGE_KEY.headers : null,
    'headers',
  );
  useEffect(() => {
    const model = getOrCreateModel({ uri: HEADER_URI, value: initialHeaders });
    // Build the editor
    const editor = createEditor(ref, { model });
    setEditor({ headerEditor: editor });
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
