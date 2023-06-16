import React from 'react';
import { useQueryEditor, UseQueryEditorArgs } from '../operations-editor';

export function OperationsEditor(props: UseQueryEditorArgs) {
  const ref = useQueryEditor(props, OperationsEditor);

  return <div className="graphiql-editor" ref={ref} />;
}
