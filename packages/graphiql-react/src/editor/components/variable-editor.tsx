import { useVariableEditor, UseVariableEditorArgs } from '../variable-editor';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/lint.css';
import '../style/hint.css';

type VariableEditorProps = UseVariableEditorArgs & {
  active?: boolean;
};

export function VariableEditor({ active, ...hookArgs }: VariableEditorProps) {
  const ref = useVariableEditor(hookArgs);
  return (
    <div
      className="codemirrorWrap"
      // This horrible hack is necessary because a simple display none toggle
      // causes one of the editors' gutters to break otherwise.
      style={{
        position: active ? 'relative' : 'absolute',
        visibility: active ? 'visible' : 'hidden',
      }}
      ref={ref}
    />
  );
}
