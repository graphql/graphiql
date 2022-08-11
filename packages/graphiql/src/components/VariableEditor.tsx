/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { useVariableEditor, UseVariableEditorArgs } from '@graphiql/react';
import React from 'react';

type VariableEditorProps = UseVariableEditorArgs & {
  active?: boolean;
};

/**
 * VariableEditor
 *
 * An instance of CodeMirror for editing variables defined in QueryEditor.
 *
 */
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
