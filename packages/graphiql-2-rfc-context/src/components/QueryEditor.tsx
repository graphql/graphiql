/* global monaco */
/** @jsx jsx */
/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { jsx } from 'theme-ui';
import { GraphQLType } from 'graphql';
import type { EditorOptions } from '../types';

import EditorWrapper from '../components/common/EditorWrapper';

import { useSessionContext } from '../api/providers/GraphiQLSessionProvider';
import { useEditorsContext } from '../api/providers/GraphiQLEditorsProvider';
import { useBrowserContext } from '../api/providers/GraphiQLBrowserProvider';

export type QueryEditorProps = {
  onEdit?: (value: string) => void;
  readOnly?: boolean;
  onHintInformationRender: (elem: HTMLDivElement) => void;
  onClickReference?: (reference: GraphQLType) => void;
  editorTheme?: string;
  operation?: string;
  editorOptions?: EditorOptions;
};

/**
 * GraphQL Operation Editor
 *
 * @param props {QueryEditorProps}
 */
export function QueryEditor(props: QueryEditorProps) {
  const divRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
  const [ignoreChangeEvent, setIgnoreChangeEvent] = React.useState(false);
  const cachedValueRef = React.useRef<string>(props.operation ?? '');
  const session = useSessionContext();
  const browser = useBrowserContext();

  const { loadEditor } = useEditorsContext();

  // function _onKeyUp(_cm: monaco.editor.IStandaloneCodeEditor, event: KeyboardEvent) {
  //   if (AUTO_COMPLETE_AFTER_KEY.test(event.key) && editorRef.current) {
  //     // @TODO recreat this in monaco
  //     //  editorRef.current.execCommand('autocomplete');
  //   }
  // }

  React.useEffect(() => {
    require('monaco-graphql/esm/monaco.contribution');
    session.changeOperation(browser.queryStringParams.operation);

    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const editor = (editorRef.current = monaco.editor.create(
      divRef.current as HTMLDivElement,
      {
        value: session?.operation?.text ?? '',
        language: 'graphqlDev',
        automaticLayout: true,
        ...props.editorOptions,
      },
    ));
    if (!editor) {
      return;
    }
    loadEditor('operation', editor);
    editor.onDidChangeModelContent(() => {
      if (!ignoreChangeEvent) {
        cachedValueRef.current = editor.getValue();
        session.changeOperation(cachedValueRef.current);
        props.onEdit && props.onEdit(cachedValueRef.current);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /**
   * Handle incoming changes via props (quasi-controlled component?)
   */
  React.useEffect(() => {
    setIgnoreChangeEvent(true);
    const editor = editorRef.current;
    const op = session?.operation?.text;
    if (editor && op && op !== cachedValueRef.current) {
      const thisValue = op || '';
      cachedValueRef.current = thisValue;
      editor.setValue(thisValue);
    }
    setIgnoreChangeEvent(false);
  }, [
    session,
    session.operation,
    session.operation.text,
    browser.queryStringParams.operation,
  ]);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    if (props.editorOptions) {
      editor.updateOptions(props.editorOptions);
    }
  }, [props.editorOptions]);

  return (
    <EditorWrapper
      sx={{ height: '100%' }}
      className="query-editor"
      aria-label="Query Editor"
      innerRef={divRef}
    />
  );
}

// /**
//  * Public API for retrieving the DOM client height for this component.
//  */
// QueryEditor.getClientHeight = () => {
//   return this._node && this._node.clientHeight;
// };
