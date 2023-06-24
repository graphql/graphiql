import { useEffect } from 'react';
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

export function HeaderEditor({ isHidden, ...hookArgs }: HeaderEditorProps) {
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
}
