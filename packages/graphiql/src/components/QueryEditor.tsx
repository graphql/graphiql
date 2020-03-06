/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import * as CM from 'codemirror';
import { GraphQLType } from 'graphql';
import MD from 'markdown-it';
import { normalizeWhitespace } from '../utility/normalizeWhitespace';
import onHasCompletion from '../utility/onHasCompletion';
import commonKeys from '../utility/commonKeys';
import { SchemaContext } from '../state/GraphiQLSchemaProvider';
import { useSessionContext } from '../state/GraphiQLSessionProvider';

const md = new MD();
const AUTO_COMPLETE_AFTER_KEY = /^[a-zA-Z0-9_@(]$/;

type QueryEditorProps = {
  onEdit?: (value: string) => void;
  readOnly?: boolean;
  onHintInformationRender: (elem: HTMLDivElement) => void;
  onClickReference?: (reference: GraphQLType) => void;
  onCopyQuery?: () => void;
  onPrettifyQuery?: () => void;
  onMergeQuery?: () => void;
  onRunQuery?: () => void;
  editorTheme?: string;
};

/**
 * QueryEditor
 *
 * Maintains an instance of CodeMirror responsible for editing a GraphQL query.
 *
 * Props:
 *
 *   - schema: A GraphQLSchema instance enabling editor linting and hinting.
 *   - value: The text of the editor.
 *   - onEdit: A function called when the editor changes, given the edited text.
 *   - readOnly: Turns the editor to read-only mode.
 *
 */
export function QueryEditor(props: QueryEditorProps) {
  const nodeRef = React.useRef(null);
  const ignoreChangeEventRef = React.useRef(false);
  const editorRef = React.useRef<(CM.Editor & { options?: any }) | null>(null);
  const session = useSessionContext();

  const cachedValueRef = React.useRef(session.operation.text || '');
  const { schema } = React.useContext(SchemaContext);
  function _onKeyUp(_cm: CM.Editor, event: KeyboardEvent) {
    if (AUTO_COMPLETE_AFTER_KEY.test(event.key) && editorRef.current) {
      editorRef.current.execCommand('autocomplete');
    }
  }

  function _onEdit(editHandler) {
    if (!ignoreChangeEventRef.current && editorRef.current) {
      cachedValueRef.current = editorRef.current.getValue();
      editHandler(cachedValueRef.current);
    }
  }

  /**
   * Render a custom UI for CodeMirror's hint which includes additional info
   * about the type and description for the selected context.
   */
  function _onHasCompletion(
    cm: CM.Editor,
    data: CM.EditorChangeLinkedList,
  ): void {
    onHasCompletion(cm, data, props.onHintInformationRender);
  }

  function _onBeforeChange(_instance: CM.Editor, change: any) {
    // The update function is only present on non-redo, non-undo events.
    if (change.origin === 'paste') {
      const text = change.text.map(normalizeWhitespace);
      change.update(change.from, change.to, text);
    }
  }

  React.useEffect(() => {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const CodeMirror = require('codemirror');
    require('codemirror/addon/hint/show-hint');
    require('codemirror/addon/comment/comment');
    require('codemirror/addon/edit/matchbrackets');
    require('codemirror/addon/edit/closebrackets');
    require('codemirror/addon/fold/foldgutter');
    require('codemirror/addon/fold/brace-fold');
    require('codemirror/addon/search/search');
    require('codemirror/addon/search/searchcursor');
    require('codemirror/addon/search/jump-to-line');
    require('codemirror/addon/dialog/dialog');
    require('codemirror/addon/lint/lint');
    require('codemirror/keymap/sublime');
    require('codemirror-graphql/hint');
    require('codemirror-graphql/lint');
    require('codemirror-graphql/info');
    require('codemirror-graphql/jump');
    require('codemirror-graphql/mode');

    const selectElement = nodeRef.current;

    editorRef.current = new CodeMirror(selectElement, {
      value: session?.operation?.text || '',
      lineNumbers: true,
      tabSize: 2,
      mode: 'graphql',
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
        schema,
      },
      hintOptions: {
        schema,
        closeOnUnfocus: false,
        completeSingle: false,
        container: selectElement,
      },
      info: {
        schema,
        renderDescription: (text: string) => md.render(text),
        onClick: (reference: GraphQLType) =>
          props.onClickReference && props.onClickReference(reference),
      },
      jump: {
        schema,
        onClick: (
          reference: GraphQLType, // TODO: it looks like this arg is not actually a GraphQL type but something from GraphiQL codemirror
        ) => props.onClickReference && props.onClickReference(reference),
      },
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Cmd-Space': () =>
          // @ts-ignore showHint method needs improvement on definatelytyped
          editorRef.current.showHint({
            completeSingle: true,
            container: selectElement,
          }),
        'Ctrl-Space': () =>
          // showHint method needs improvement on definatelytyped
          // @ts-ignore
          editorRef.current.showHint({
            completeSingle: true,
            container: selectElement,
          }),
        'Alt-Space': () =>
          // @ts-ignore showHint method needs improvement on definatelytyped
          editorRef.current.showHint({
            completeSingle: true,
            container: selectElement,
          }),
        'Shift-Space': () =>
          // @ts-ignore showHint method needs improvement on definatelytyped
          editorRef.current.showHint({
            completeSingle: true,
            container: selectElement,
          }),
        'Shift-Alt-Space': () =>
          // @ts-ignore showHint method needs improvement on definatelytyped
          editorRef.current.showHint({
            completeSingle: true,
            container: selectElement,
          }),

        'Cmd-Enter': () => session.executeOperation(session),
        'Ctrl-Enter': () => session.executeOperation(session),

        'Shift-Ctrl-C': () => {
          if (props.onCopyQuery) {
            props.onCopyQuery();
          }
        },

        'Shift-Ctrl-P': () => {
          if (props.onPrettifyQuery) {
            props.onPrettifyQuery();
          }
        },

        /* Shift-Ctrl-P is hard coded in Firefox for private browsing so adding an alternative to Pretiffy */
        'Shift-Ctrl-F': () => {
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
        'Cmd-S': () => {},
        'Ctrl-S': () => {},
      },
    });

    const editHandler = () => _onEdit(session.changeOperation);
    if (editorRef.current) {
      editorRef.current.on('change', editHandler);
      editorRef.current.on('keyup', _onKeyUp);
      // @ts-ignore @TODO additional args for hasCompletion event
      editorRef.current.on('hasCompletion', _onHasCompletion);
      editorRef.current.on('beforeChange', _onBeforeChange);
    }

    return function cleanup() {
      if (editorRef.current) {
        editorRef.current.off('change', editHandler);
        editorRef.current.off('keyup', _onKeyUp);
        editorRef.current.off('hasCompletion', _onHasCompletion);
        editorRef.current.off('beforeChange', _onBeforeChange);
      }
    };
  }, []);

  React.useEffect(() => {
    const CodeMirror = require('codemirror');
    // Ensure the changes caused by this update are not interpretted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    ignoreChangeEventRef.current = true;
    if (editorRef.current && editorRef.current.options.lint.schema !== schema) {
      // on schmea change, update the underlying schemas
      editorRef.current.options.lint.schema = schema;
      editorRef.current.options.hintOptions.schema = schema;
      editorRef.current.options.info.schema = schema;
      editorRef.current.options.jump.schema = schema;
      CodeMirror.signal(editorRef.current, 'change', editorRef.current);
    }

    if (
      session?.operation?.text !== cachedValueRef.current &&
      editorRef.current
    ) {
      cachedValueRef.current = session?.operation?.text ?? '';
      editorRef.current.setValue(session?.operation?.text ?? '');
    }
    ignoreChangeEventRef.current = false;
  }, [schema, session.operation]);

  return (
    <section className="query-editor" aria-label="Query Editor" ref={nodeRef} />
  );
}

// /**
//  * Public API for retrieving the DOM client height for this component.
//  */
// QueryEditor.getClientHeight = () => {
//   return this._node && this._node.clientHeight;
// };
