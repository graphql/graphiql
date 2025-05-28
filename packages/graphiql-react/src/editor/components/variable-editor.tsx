import { FC, useEffect } from 'react';
import { clsx } from 'clsx';

import { useEditorContext } from '../context';
import { useVariableEditor, UseVariableEditorArgs } from '../variable-editor';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/lint.css';
import '../style/hint.css';
import '../style/editor.css';

type VariableEditorProps = UseVariableEditorArgs & {
  /**
   * Visually hide the header editor.
   * @default false
   */
  isHidden?: boolean;
};

export const VariableEditor: FC<VariableEditorProps> = ({
  isHidden,
  ...hookArgs
}) => {
  const { variableEditor } = useEditorContext({
    nonNull: true,
    caller: VariableEditor,
  });
  const ref = useVariableEditor(hookArgs, VariableEditor);

  useEffect(() => {
    if (!isHidden) {
      variableEditor?.refresh();
    }
  }, [variableEditor, isHidden]);

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
};
