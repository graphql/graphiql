import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { useEditorContext } from '../context';
import { UseHeaderEditorArgs } from '../header-editor';
import '../style/editor.css';
import { createEditor } from '@/create-editor';
import { HEADERS_MODEL } from '@/constants';
import debounce from '@/utility/debounce';
import { useStorageContext } from '@/storage';

type HeaderEditorProps = UseHeaderEditorArgs & {
  /**
   * Visually hide the header editor.
   * @default false
   */
  isHidden?: boolean;
};

export function HeadersEditor({ isHidden, ...hookArgs }: HeaderEditorProps) {
  const { setHeaderEditor, updateActiveTabValues, shouldPersistHeaders } =
    useEditorContext({
      nonNull: true,
      caller: HeadersEditor,
    });
  const ref = useRef<HTMLDivElement>(null);
  const storage = useStorageContext();

  useEffect(() => {
    setHeaderEditor(createEditor('headers', ref.current!));
    if (!shouldPersistHeaders) {
      return;
    }
    HEADERS_MODEL.onDidChangeContent(
      debounce(500, () => {
        const value = HEADERS_MODEL.getValue();
        storage?.set(STORAGE_KEY, value);
        updateActiveTabValues({ headers: value });
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
}

export const STORAGE_KEY = 'headers';
