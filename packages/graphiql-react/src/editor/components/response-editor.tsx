import { useResponseEditor, UseResponseEditorArgs } from '../response-editor';
import { FC } from 'react';
import '../style/codemirror.css';
import '../style/fold.css';
import '../style/info.css';
import '../style/editor.css';

export const ResponseEditor: FC<UseResponseEditorArgs> = props => {
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
};
