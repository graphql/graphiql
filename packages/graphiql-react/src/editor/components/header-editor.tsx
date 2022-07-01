import { useHeaderEditor, UseHeaderEditorArgs } from '../header-editor';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/editor.css';

type HeaderEditorProps = UseHeaderEditorArgs & { isHidden?: boolean };

export function HeaderEditor({ isHidden, ...hookArgs }: HeaderEditorProps) {
  const ref = useHeaderEditor(hookArgs);
  return (
    <div className={`graphiql-editor${isHidden ? ' hidden' : ''}`} ref={ref} />
  );
}
