/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { useQueryEditor, UseQueryEditorArgs } from '@graphiql/react';
import React from 'react';

/**
 * QueryEditor
 *
 * Maintains an instance of CodeMirror responsible for editing a GraphQL query.
 *
 */
export function QueryEditor(props: UseQueryEditorArgs) {
  const ref = useQueryEditor(props);
  return (
    <section className="query-editor" aria-label="Query Editor" ref={ref} />
  );
}
