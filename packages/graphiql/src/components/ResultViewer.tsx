/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';

import type { EditorOptions } from '../types';

import { useSessionContext } from '../api/providers/GraphiQLSessionProvider';
import { useEditorsContext } from '../api/providers/GraphiQLEditorsProvider';

export type ResultViewerProps = {
  editorTheme?: string;
  editorOptions?: EditorOptions;
  onMouseUp?: (e: monaco.editor.IEditorMouseEvent) => void;
  onRenderResults?: (e: monaco.editor.IModelChangedEvent) => void;
};

export function ResultViewer(props: ResultViewerProps) {
  const divRef = React.useRef<HTMLElement | null>(null);
  const viewerRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
  const session = useSessionContext();
  const { loadEditor } = useEditorsContext();
  useEffect(() => {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.

    const viewer = (viewerRef.current = monaco.editor.create(
      divRef.current as HTMLElement,
      {
        value: session.results?.text ?? '',
        readOnly: true,
        language: 'json',
        automaticLayout: true,
        theme: props.editorTheme,
      },
    ));
    loadEditor('results', viewer);
    props.onMouseUp && viewer.onMouseUp(props.onMouseUp);
    props.onRenderResults && viewer.onDidChangeModel(props.onRenderResults);
  }, []);

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.setValue(session.results.text || '');
    }
  }, [session.results, session.results.text]);

  React.useEffect(() => {
    const editor = viewerRef.current;
    if (!editor) {
      return;
    }
    if (props.editorOptions) {
      editor.updateOptions(props.editorOptions);
    }
  }, [props.editorOptions]);
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
