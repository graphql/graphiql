import { FC, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { useGraphiQL } from './provider';
import { EditorProps } from '../types';
import { HEADER_URI, KEY_BINDINGS } from '../constants';
import {
  getOrCreateModel,
  createEditor,
  useChangeHandler,
  onEditorContainerKeyDown,
  pick,
  usePrettifyEditors,
  useMergeQuery,
  cleanupDisposables,
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
  const { initialHeaders, shouldPersistHeaders, setEditor, run } = useGraphiQL(
    pick('initialHeaders', 'shouldPersistHeaders', 'setEditor', 'run'),
  );
  const ref = useRef<HTMLDivElement>(null!);
  useChangeHandler(
    onEdit,
    shouldPersistHeaders ? STORAGE_KEY : null,
    'headers',
  );
  const prettifyEditors = usePrettifyEditors();
  const mergeQuery = useMergeQuery();
  useEffect(() => {
    const model = getOrCreateModel({ uri: HEADER_URI, value: initialHeaders });
    // Build the editor
    const editor = createEditor(ref, { model, readOnly });
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
      className={clsx('graphiql-editor', props.className)}
    />
  );
};

export const STORAGE_KEY = 'headers';
