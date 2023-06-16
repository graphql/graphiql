import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { UseVariableEditorArgs } from '../variable-editor';
import { createEditor } from '@/create-editor';
import { VARIABLES_MODEL } from '@/constants';
import { useStorageContext } from '@/storage';
import { useEditorContext } from '@/editor';
import debounce from '@/utility/debounce';

type VariableEditorProps = UseVariableEditorArgs & {
  /**
   * Visually hide the header editor.
   * @default false
   */
  isHidden?: boolean;
};

export function VariablesEditor({
  isHidden,
  ...hookArgs
}: VariableEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const storage = useStorageContext();

  const { updateActiveTabValues, setVariableEditor } = useEditorContext({
    nonNull: true,
    caller: VariablesEditor,
  });

  useEffect(() => {
    setVariableEditor(createEditor('variables', ref.current!));
    VARIABLES_MODEL.onDidChangeContent(
      debounce(500, () => {
        const value = VARIABLES_MODEL.getValue();
        storage?.set(STORAGE_KEY, value);
        updateActiveTabValues({ variables: value });
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
}

const STORAGE_KEY = 'variables';
