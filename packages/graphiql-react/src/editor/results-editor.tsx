import { UseResponseEditorArgs } from '../response-editor';
import { useEffect, useRef } from 'react';
import { createEditor } from '@/create-editor';
import { useEditorContext } from '@/editor';
import '../style/editor.css';

export function ResultsEditor(props: UseResponseEditorArgs) {
  const ref = useRef<HTMLDivElement>(null);

  const { setResponseEditor } = useEditorContext({
    nonNull: true,
    caller: ResultsEditor,
  });

  useEffect(() => {
    setResponseEditor(createEditor('results', ref.current!));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

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
