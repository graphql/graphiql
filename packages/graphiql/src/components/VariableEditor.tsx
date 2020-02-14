/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { GraphQLType } from 'graphql';
import * as CM from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import * as React from 'react';

import onHasCompletion from '../utility/onHasCompletion';
import commonKeys from '../utility/commonKeys';

type VariableEditorProps = {
  variableToType?: { [variable: string]: GraphQLType };
  value?: string;
  onEdit: (value: string) => void;
  readOnly: boolean;
  onHintInformationRender: (value: HTMLDivElement) => void;
  onPrettifyQuery: (value?: string) => void;
  onMergeQuery: (value?: string) => void;
  onRunQuery: (value?: string) => void;
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
export class VariableEditor extends React.Component<VariableEditorProps> {
  editor: CM.Editor;
  cachedValue: string;
  _node: HTMLElement;
  ignoreChangeEvent: boolean;

  constructor(props: VariableEditorProps) {
    super(props);

    // Keep a cached version of the value, this cache will be updated when the
    // editor is updated, which can later be used to protect the editor from
    // unnecessary updates during the update lifecycle.
    this.cachedValue = props.value || '';
    this.ignoreChangeEvent = true;
  }

  componentDidMount() {
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

    const editor = (this.editor = CodeMirror(this._node, {
      value: this.props.value || '',
      lineNumbers: true,
      tabSize: 2,
      mode: 'graphql-variables',
      theme: this.props.editorTheme || 'graphiql',
      keyMap: 'sublime',
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      readOnly: this.props.readOnly ? 'nocursor' : false,
      foldGutter: {
        minFoldSize: 4,
      },
      lint: {
        variableToType: this.props.variableToType,
      },
      hintOptions: {
        variableToType: this.props.variableToType,
        closeOnUnfocus: false,
        completeSingle: false,
        container: this._node,
      },
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Cmd-Space': () =>
          this.editor.showHint({
            completeSingle: false,
            container: this._node,
          }),
        'Ctrl-Space': () =>
          this.editor.showHint({
            completeSingle: false,
            container: this._node,
          }),
        'Alt-Space': () =>
          this.editor.showHint({
            completeSingle: false,
            container: this._node,
          }),
        'Shift-Space': () =>
          this.editor.showHint({
            completeSingle: false,
            container: this._node,
          }),
        'Cmd-Enter': () => {
          if (this.props.onRunQuery) {
            this.props.onRunQuery();
          }
        },
        'Ctrl-Enter': () => {
          if (this.props.onRunQuery) {
            this.props.onRunQuery();
          }
        },
        'Shift-Ctrl-P': () => {
          if (this.props.onPrettifyQuery) {
            this.props.onPrettifyQuery();
          }
        },

        'Shift-Ctrl-M': () => {
          if (this.props.onMergeQuery) {
            this.props.onMergeQuery();
          }
        },

        ...commonKeys,
      },
    }));

    editor.on('change', this._onEdit);
    editor.on('keyup', this._onKeyUp);
    editor.on('hasCompletion', this._onHasCompletion);
  }

  componentDidUpdate(prevProps: VariableEditorProps) {
    const CodeMirror = require('codemirror');
    if (!this.editor) {
      return;
    }

    // Ensure the changes caused by this update are not interpretted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    this.ignoreChangeEvent = true;
    if (this.props.variableToType !== prevProps.variableToType) {
      this.editor.options.lint.variableToType = this.props.variableToType;
      this.editor.options.hintOptions.variableToType = this.props.variableToType;
      CodeMirror.signal(this.editor, 'change', this.editor);
    }
    if (
      this.props.value !== prevProps.value &&
      this.props.value !== this.cachedValue
    ) {
      const thisValue = this.props.value || '';
      this.cachedValue = thisValue;
      this.editor.setValue(thisValue);
    }
    this.ignoreChangeEvent = false;
  }

  componentWillUnmount() {
    if (!this.editor) {
      return;
    }
    this.editor.off('change', this._onEdit);
    this.editor.off('keyup', this._onKeyUp);
    this.editor.off('hasCompletion', this._onHasCompletion);
    this.editor = null;
  }

  render() {
    return (
      <div
        className="codemirrorWrap"
        ref={node => {
          this._node = node as HTMLDivElement;
        }}
      />
    );
  }

  /**
   * Public API for retrieving the CodeMirror instance from this
   * React component.
   */
  getCodeMirror() {
    return this.editor;
  }

  /**
   * Public API for retrieving the DOM client height for this component.
   */
  getClientHeight() {
    return this._node && this._node.clientHeight;
  }

  private _onKeyUp = (_cm: CodeMirror.Editor, event: KeyboardEvent) => {
    const code = event.keyCode;
    if (!this.editor) {
      return;
    }
    if (
      (code >= 65 && code <= 90) || // letters
      (!event.shiftKey && code >= 48 && code <= 57) || // numbers
      (event.shiftKey && code === 189) || // underscore
      (event.shiftKey && code === 222) // "
    ) {
      this.editor.execCommand('autocomplete');
    }
  };

  private _onEdit = () => {
    if (!this.editor) {
      return;
    }
    if (!this.ignoreChangeEvent) {
      this.cachedValue = this.editor.getValue();
      if (this.props.onEdit) {
        this.props.onEdit(this.cachedValue);
      }
    }
  };

  _onHasCompletion = (cm: CodeMirror.Editor, data: any) => {
    onHasCompletion(cm, data, this.props.onHintInformationRender);
  };
}
