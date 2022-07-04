import { useResponseEditor, UseResponseEditorArgs } from '../response-editor';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/info.css';
import '../style/editor.css';

export function ResponseEditor(props: UseResponseEditorArgs) {
  const ref = useResponseEditor(props, ResponseEditor);
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
