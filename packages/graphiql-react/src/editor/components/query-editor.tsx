import { useQueryEditor, UseQueryEditorArgs } from '../query-editor';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/lint.css';
import '../style/hint.css';
import '../style/info.css';
import '../style/jump.css';

export function QueryEditor(props: UseQueryEditorArgs) {
  const ref = useQueryEditor(props);
  return (
    <section className="query-editor" aria-label="Query Editor" ref={ref} />
  );
}
