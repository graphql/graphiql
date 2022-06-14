import { useResponseEditor, UseResponseEditorArgs } from '../response-editor';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/info.css';

export function ResponseEditor(props: UseResponseEditorArgs) {
  const ref = useResponseEditor(props);
  return (
    <section
      className="result-window"
      aria-label="Result Window"
      aria-live="polite"
      aria-atomic="true"
      ref={ref}
    />
  );
}
