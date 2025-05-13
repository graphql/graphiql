import { FC, useEffect } from 'react';
import { clsx } from 'clsx';
import { useEditorStore } from '../context';
import { useHeaderEditor, UseHeaderEditorArgs } from '../header-editor';
import '../style/codemirror.css';
import '../style/fold.css';
import '../style/editor.css';

type HeaderEditorProps = UseHeaderEditorArgs & {
  /**
   * Visually hide the header editor.
   * @default false
   */
  isHidden?: boolean;
};

export const HeaderEditor: FC<HeaderEditorProps> = ({
  isHidden,
  ...hookArgs
}) => {
  const { headerEditor } = useEditorStore();
  const ref = useHeaderEditor(hookArgs);

  useEffect(() => {
    if (!isHidden) {
      headerEditor?.refresh();
    }
  }, [headerEditor, isHidden]);

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
};
