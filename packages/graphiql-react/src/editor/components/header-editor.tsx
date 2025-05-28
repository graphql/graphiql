import { FC, useEffect } from 'react';
import { clsx } from 'clsx';
import { useEditorContext } from '../context';
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
  const { headerEditor } = useEditorContext({
    nonNull: true,
    caller: HeaderEditor,
  });
  const ref = useHeaderEditor(hookArgs, HeaderEditor);

  useEffect(() => {
    if (!isHidden) {
      headerEditor?.refresh();
    }
  }, [headerEditor, isHidden]);

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
};
