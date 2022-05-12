/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { useHeaderEditor, UseHeaderEditorArgs } from '@graphiql/react';
import React from 'react';

type HeaderEditorProps = UseHeaderEditorArgs & { active?: boolean };

/**
 * HeaderEditor
 *
 * An instance of CodeMirror for editing headers to be passed with the GraphQL request.
 *
 */
export function HeaderEditor({ active, ...hookArgs }: HeaderEditorProps) {
  const ref = useHeaderEditor(hookArgs);
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
