import { FC } from 'react';
import { useQueryEditor, UseQueryEditorArgs } from '../query-editor';
import '../style/codemirror.css';
import '../style/fold.css';
import '../style/lint.css';
import '../style/hint.css';
import '../style/info.css';
import '../style/jump.css';
import '../style/auto-insertion.css';
import '../style/editor.css';

export const QueryEditor: FC<UseQueryEditorArgs> = props => {
  const ref = useQueryEditor(props, QueryEditor);
  return <div className="graphiql-editor" ref={ref} />;
};
