/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { GraphQLType } from 'graphql';
import * as CM from 'codemirror';

import React from 'react';
import onHasCompletion from '../utility/onHasCompletion';
import commonKeys from '../utility/commonKeys';
import { useSessionContext } from '../state/GraphiQLSessionProvider';
import { useSchemaContext } from '../state/GraphiQLSchemaProvider';
import getQueryFacts from '../utility/getQueryFacts';

declare module CodeMirror {
  export interface Editor extends CM.Editor {}
  export interface ShowHintOptions {
    completeSingle: boolean;
    // we have to globally import for these types to work, which breaks SSR
    // @ts-ignore
    hint: CM.HintFunction | CM.AsyncHintFunction;
    container: HTMLElement | null;
  }
}

type VariableEditorProps = {
  variableToType?: { [variable: string]: GraphQLType };
  value?: string;
  readOnly?: boolean;
  onHintInformationRender: (value: HTMLDivElement) => void;
  onPrettifyQuery: (value?: string) => void;
  onMergeQuery: (value?: string) => void;
  editorTheme?: string;
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
  const { schema } = useSchemaContext();
  const [ignoreChangeEvent, setIgnoreChangeEvent] = React.useState(false);
  const editorRef = React.useRef<(CM.Editor & { options: any }) | null>(null);
  const cachedValueRef = React.useRef<string>(props.value ?? '');
  const divRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const CodeMirror = require('codemirror');
    require('codemirror/addon/hint/show-hint');
    require('codemirror/addon/edit/matchbrackets');
    require('codemirror/addon/edit/closebrackets');
    require('codemirror/addon/fold/brace-fold');
    require('codemirror/addon/fold/foldgutter');
    require('codemirror/addon/lint/lint');
    require('codemirror/addon/search/searchcursor');
    require('codemirror/addon/search/jump-to-line');
    require('codemirror/addon/dialog/dialog');
    require('codemirror/keymap/sublime');
    require('codemirror-graphql/variables/hint');
    require('codemirror-graphql/variables/lint');
    require('codemirror-graphql/variables/mode');
    require('codemirror/addon/hint/show-hint');

    const _onKeyUp = (_cm: CodeMirror.Editor, event: KeyboardEvent) => {
      const code = event.keyCode;
      if (!editor) {
        return;
      }
      if (
        (code >= 65 && code <= 90) || // letters
        (!event.shiftKey && code >= 48 && code <= 57) || // numbers
        (event.shiftKey && code === 189) || // underscore
        (event.shiftKey && code === 222) // "
      ) {
        editor.execCommand('autocomplete');
      }
    };

    const _onEdit = () => {
      if (!editor) {
        return;
      }
      if (!ignoreChangeEvent) {
        cachedValueRef.current = editor.getValue();
        session.changeVariables(cachedValueRef.current);
      }
    };

    const _onHasCompletion = (
      instance: CM.Editor,
      changeObj?: CM.EditorChangeLinkedList,
    ) => {
      onHasCompletion(instance, changeObj, props.onHintInformationRender);
    };

    const editor = (editorRef.current = CodeMirror(divRef.current, {
      value: session.variables.text || '',
      lineNumbers: true,
      tabSize: 2,
      mode: 'graphql-variables',
      theme: props.editorTheme || 'graphiql',
      keyMap: 'sublime',
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      readOnly: props.readOnly ? 'nocursor' : false,
      foldGutter: {
        minFoldSize: 4,
      },
      lint: {
        variableToType: props.variableToType,
      },
      hintOptions: {
        variableToType: props.variableToType,
        closeOnUnfocus: false,
        completeSingle: false,
        container: divRef.current,
      },
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Cmd-Space': () =>
          editor!.showHint({
            completeSingle: false,
            container: divRef.current,
          }),
        'Ctrl-Space': () =>
          editor!.showHint({
            completeSingle: false,
            container: divRef.current,
          }),
        'Alt-Space': () =>
          editor!.showHint({
            completeSingle: false,
            container: divRef.current,
          }),
        'Shift-Space': () =>
          editor!.showHint({
            completeSingle: false,
            container: divRef.current,
          }),
        'Cmd-Enter': () => {
          session.executeOperation(session);
        },
        'Ctrl-Enter': () => {
          session.executeOperation(session);
        },
        'Shift-Ctrl-P': () => {
          if (props.onPrettifyQuery) {
            props.onPrettifyQuery();
          }
        },

        'Shift-Ctrl-M': () => {
          if (props.onMergeQuery) {
            props.onMergeQuery();
          }
        },

        ...commonKeys,
      },
    }));

    editor.on('change', _onEdit);
    editor.on('keyup', _onKeyUp);
    editor.on('hasCompletion', _onHasCompletion);
    return () => {
      editor.off('change', _onEdit);
      editor.off('keyup', _onKeyUp);
      editor.off('hasCompletion', _onHasCompletion);
      editorRef.current = null;
    };
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
      const CodeMirror = require('codemirror');
      const thisValue = session.variables.text || '';
      cachedValueRef.current = thisValue;
      editor.setValue(thisValue);
      CodeMirror.signal(editor, 'change', editor);
    }

    setIgnoreChangeEvent(false);
  }, [session.variables.text]);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    if (session?.variableToType) {
      editor.options.lint.variableToType = session.variableToType;
      editor.options.hintOptions.variableToType = session.variableToType;
    }
  }, [session.operation.text, schema]);

  return <div className="codemirrorWrap" ref={divRef} />;
}
