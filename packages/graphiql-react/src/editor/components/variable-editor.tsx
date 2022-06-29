import { useVariableEditor, UseVariableEditorArgs } from '../variable-editor';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/lint.css';
import '../style/hint.css';

type VariableEditorProps = UseVariableEditorArgs & {
  isHidden?: boolean;
};

export function VariableEditor({ isHidden, ...hookArgs }: VariableEditorProps) {
  const ref = useVariableEditor(hookArgs);
  return (
    <div className={`graphiql-editor${isHidden ? ' hidden' : ''}`} ref={ref} />
  );
}
