import { useEffect } from 'react';

import { useEditorContext } from '../context';
import { useHeaderEditor, UseHeaderEditorArgs } from '../header-editor';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/editor.css';

type HeaderEditorProps = UseHeaderEditorArgs & { isHidden?: boolean };

export function HeaderEditor({ isHidden, ...hookArgs }: HeaderEditorProps) {
  const { headerEditor } = useEditorContext({
    nonNull: true,
    caller: HeaderEditor,
  });
  const ref = useHeaderEditor(hookArgs);

  useEffect(() => {
    if (headerEditor && !isHidden) {
      headerEditor.refresh();
    }
  }, [headerEditor, isHidden]);

  return (
    <div className={`graphiql-editor${isHidden ? ' hidden' : ''}`} ref={ref} />
  );
}
