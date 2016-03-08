/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/lint/lint';
import 'codemirror/keymap/sublime';
import 'codemirror-graphql/variables/hint';
import 'codemirror-graphql/variables/lint';
import 'codemirror-graphql/variables/mode';

import onHasCompletion from '../utility/onHasCompletion';


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
 *
 */
export class VariableEditor extends React.Component {
  static propTypes = {
    variableToType: PropTypes.object,
    value: PropTypes.string,
    onEdit: PropTypes.func
  }

  constructor(props) {
    super();

    // Keep a cached version of the value, this cache will be updated when the
    // editor is updated, which can later be used to protect the editor from
    // unnecessary updates during the update lifecycle.
    this.cachedValue = props.value || '';
  }

  componentDidMount() {
    this.editor = CodeMirror(ReactDOM.findDOMNode(this), {
      value: this.props.value || '',
      lineNumbers: true,
      tabSize: 2,
      mode: 'graphql-variables',
      theme: 'graphiql',
      keyMap: 'sublime',
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      foldGutter: {
        minFoldSize: 4
      },
      lint: {
        variableToType: this.props.variableToType
      },
      hintOptions: {
        variableToType: this.props.variableToType
      },
      gutters: [ 'CodeMirror-linenumbers', 'CodeMirror-foldgutter' ],
      extraKeys: {
        'Cmd-Space': () => this.editor.showHint({ completeSingle: false }),
        'Ctrl-Space': () => this.editor.showHint({ completeSingle: false }),
        'Alt-Space': () => this.editor.showHint({ completeSingle: false }),
        'Shift-Space': () => this.editor.showHint({ completeSingle: false }),

        // Editor improvements
        'Ctrl-Left': 'goSubwordLeft',
        'Ctrl-Right': 'goSubwordRight',
        'Alt-Left': 'goGroupLeft',
        'Alt-Right': 'goGroupRight',
      }
    });

    this.editor.on('change', this._onEdit);
    this.editor.on('keyup', this._onKeyUp);
    this.editor.on('hasCompletion', this._onHasCompletion);
  }

  componentWillUnmount() {
    this.editor.off('change', this._onEdit);
    this.editor.off('keyup', this._onKeyUp);
    this.editor.off('hasCompletion', this._onHasCompletion);
    this.editor = null;
  }

  componentDidUpdate(prevProps) {
    // Ensure the changes caused by this update are not interpretted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    this.ignoreChangeEvent = true;
    if (this.props.variableToType !== prevProps.variableToType) {
      this.editor.options.lint.variableToType = this.props.variableToType;
      this.editor.options.hintOptions.variableToType =
        this.props.variableToType;
      CodeMirror.signal(this.editor, 'change', this.editor);
    }
    if (this.props.value !== prevProps.value &&
        this.props.value !== this.cachedValue) {
      this.cachedValue = this.props.value;
      this.editor.setValue(this.props.value);
    }
    this.ignoreChangeEvent = false;
  }

  _onKeyUp = (cm, event) => {
    var code = event.keyCode;
    if (
      (code >= 65 && code <= 90) || // letters
      (!event.shiftKey && code >= 48 && code <= 57) || // numbers
      (event.shiftKey && code === 189) || // underscore
      (event.shiftKey && code === 222) // "
    ) {
      this.editor.execCommand('autocomplete');
    }
  }

  _onEdit = () => {
    if (!this.ignoreChangeEvent) {
      this.cachedValue = this.editor.getValue();
      if (this.props.onEdit) {
        this.props.onEdit(this.cachedValue);
      }
    }
  }

  _onHasCompletion = (cm, data) => {
    onHasCompletion(cm, data, this.props.onHintInformationRender);
  }

  render() {
    return <div className="codemirrorWrap" ref="codemirror" />;
  }
}
