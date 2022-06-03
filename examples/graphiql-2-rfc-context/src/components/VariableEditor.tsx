/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/** @jsx jsx */
import { jsx } from 'theme-ui';
import { GraphQLType } from 'graphql';

import React from 'react';

import EditorWrapper from '../components/common/EditorWrapper';

import { useEditorsContext } from '../api/providers/GraphiQLEditorsProvider';
import { useSessionContext } from '../api/providers/GraphiQLSessionProvider';

import type { EditorOptions } from '../types';
// import useQueryFacts from '../api/hooks/useQueryFacts';

export type VariableEditorProps = {
  variableToType?: { [variable: string]: GraphQLType };
  value?: string;
  readOnly?: boolean;
  onHintInformationRender: (value: HTMLDivElement) => void;
  onPrettifyQuery: (value?: string) => void;
  onMergeQuery: (value?: string) => void;
  editorTheme?: string;
  editorOptions?: EditorOptions;
};

/**
 * VariableEditor
 *
 * An instance of CodeMirror for editing variables defined in QueryEditor.
 *
 * Props:
 *
 *   - variableToType: A mapping of variable name to GraphQLType.
 *   - value: The text of the editor.
 *   - onEdit: A function called when the editor changes, given the edited text.
 *   - readOnly: Turns the editor to read-only mode.
 *
 */
export function VariableEditor(props: VariableEditorProps) {
  const session = useSessionContext();
  // const queryFacts = useQueryFacts();
  const [ignoreChangeEvent, setIgnoreChangeEvent] = React.useState(false);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
  const cachedValueRef = React.useRef<string>(props.value ?? '');
  const divRef = React.useRef<HTMLDivElement>(null);
  const { loadEditor } = useEditorsContext();
  // const variableToType = queryFacts?.variableToType

  React.useEffect(() => {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.

    // might need this later
    // const _onKeyUp = (_cm: CodeMirror.Editor, event: KeyboardEvent) => {
    //   const code = event.keyCode;
    //   if (!editor) {
    //     return;
    //   }
    //   if (
    //     (code >= 65 && code <= 90) || // letters
    //     (!event.shiftKey && code >= 48 && code <= 57) || // numbers
    //     (event.shiftKey && code === 189) || // underscore
    //     (event.shiftKey && code === 222) // "
    //   ) {
    //     editor.execCommand('autocomplete');
    //   }
    // };
    const editor = (editorRef.current = monaco.editor.create(
      divRef.current as HTMLDivElement,
      {
        value: session?.variables?.text || '',
        language: 'json',
        theme: props?.editorTheme,
        readOnly: props?.readOnly ?? false,
        automaticLayout: true,
        ...props.editorOptions,
      },
    ));
    loadEditor('variables', editor);

    editor.onDidChangeModelContent(() => {
      if (!ignoreChangeEvent) {
        cachedValueRef.current = editor.getValue();
        session.changeVariables(cachedValueRef.current);
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
    if (session.variables.text !== cachedValueRef.current) {
      const thisValue = session.variables.text || '';
      cachedValueRef.current = thisValue;
      editor.setValue(thisValue);
    }

    setIgnoreChangeEvent(false);
  }, [session.variables.text]);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    if (props.editorOptions) {
      editor.updateOptions(props.editorOptions);
    }
  }, [props.editorOptions]);

  // TODO: for variables linting/etc
  // React.useEffect(() => {
  //   const editor = editorRef.current;
  //   if (!editor) {
  //     return;
  //   }
  //   if (queryFacts?.variableToType) {
  //     // editor.options.lint.variableToType = queryFacts.variableToType;
  //     // editor.options.hintOptions.variableToType = queryFacts.variableToType;
  //   }
  // }, [queryFacts, variableToType]);

  return <EditorWrapper className="variables-editor" innerRef={divRef} />;
}
