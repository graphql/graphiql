/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';

import { useSessionContext } from '../api/providers/GraphiQLSessionProvider';
import { useEditorsContext } from '../api/providers/GraphiQLEditorsProvider';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

type ResultViewerProps = {
  editorTheme?: string;
};

export function ResultViewer(props: ResultViewerProps) {
  const divRef = React.useRef<HTMLElement | null>(null);
  const viewerRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
  const session = useSessionContext();
  const { loadEditor } = useEditorsContext();
  useEffect(() => {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.

    viewerRef.current = monaco.editor.create(divRef.current as HTMLElement, {
      value: session.results?.text ?? '',
      readOnly: true,
      language: 'json',
      automaticLayout: true,
      theme: props.editorTheme,
    });
    loadEditor('results', viewerRef.current);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.setValue(session.results.text || '');
    }
  }, [session.results, session.results.text]);

  return (
    <section
      className="result-window"
      aria-label="Result Window"
      aria-live="polite"
      aria-atomic="true"
      ref={divRef}
    />
  );
}
