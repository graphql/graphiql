/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/** @jsx jsx */
import { jsx } from 'theme-ui';

import React from 'react';

import EditorWrapper from '../components/common/EditorWrapper';

import { useEditorsContext } from '../api/providers/GraphiQLEditorsProvider';
import { useSessionContext } from '../api/providers/GraphiQLSessionProvider';

import type { EditorOptions } from '../types';

export type HeaderEditorProps = {
  value?: string;
  readOnly?: boolean;
  onHintInformationRender: (value: HTMLDivElement) => void;
  onPrettifyQuery: (value?: string) => void;
  onMergeQuery: (value?: string) => void;
  editorTheme?: string;
  editorOptions?: EditorOptions;
};

/**
 * HeaderEditor
 *
 * An instance of Monaco for editing headers.
 *
 * Props:
 *
 *   - value: The text of the editor.
 *   - onEdit: A function called when the editor changes, given the edited text.
 *   - readOnly: Turns the editor to read-only mode.
 *
 */
export function HeaderEditor(props: HeaderEditorProps) {
  const session = useSessionContext();
  const [ignoreChangeEvent, setIgnoreChangeEvent] = React.useState(false);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
  const cachedValueRef = React.useRef<string>(props.value ?? '');
  const divRef = React.useRef<HTMLDivElement>(null);
  const { loadEditor } = useEditorsContext();

  React.useEffect(() => {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.

    const editor = (editorRef.current = monaco.editor.create(
      divRef.current as HTMLDivElement,
      {
        value: session?.headers?.text || '',
        language: 'json',
        theme: props?.editorTheme,
        readOnly: props?.readOnly ?? false,
        automaticLayout: true,
        ...props.editorOptions,
      },
    ));
    loadEditor('headers', editor);

    editor.onDidChangeModelContent(() => {
      if (!ignoreChangeEvent) {
        cachedValueRef.current = editor.getValue();
        session.changeHeaders(cachedValueRef.current);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    // Ensure the changes caused by this update are not interpretted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    setIgnoreChangeEvent(true);
    if (session.headers.text !== cachedValueRef.current) {
      const thisValue = session.headers.text || '';
      cachedValueRef.current = thisValue;
      editor.setValue(thisValue);
    }

    setIgnoreChangeEvent(false);
  }, [session.headers.text]);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    if (props.editorOptions) {
      editor.updateOptions(props.editorOptions);
    }
  }, [props.editorOptions]);

  return <EditorWrapper className="headers-editor" innerRef={divRef} />;
}
