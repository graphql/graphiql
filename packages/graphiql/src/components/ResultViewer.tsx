/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { useResultEditor, UseResultEditorArgs } from '@graphiql/react';
import React from 'react';

export const RESULT_VIEWER_ID = 'graphiql-result-viewer';

/**
 * ResultViewer
 *
 * Maintains an instance of CodeMirror for viewing a GraphQL response.
 *
 */
export function ResultViewer(props: UseResultEditorArgs) {
  const ref = useResultEditor(props);
  return (
    <section
      id={RESULT_VIEWER_ID}
      className="result-window"
      aria-label="Result Window"
      aria-live="polite"
      aria-atomic="true"
      ref={ref}
    />
  );
}
