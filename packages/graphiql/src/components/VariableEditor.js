/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

import onHasCompletion from '../utility/onHasCompletion';
import commonKeys from '../utility/commonKeys';

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
export class VariableEditor extends React.Component {
  static propTypes = {
    variableToType: PropTypes.object,
    value: PropTypes.string,
    onEdit: PropTypes.func,
    readOnly: PropTypes.bool,
    onHintInformationRender: PropTypes.func,
    onPrettifyQuery: PropTypes.func,
    onMergeQuery: PropTypes.func,
    onRunQuery: PropTypes.func,
    editorTheme: PropTypes.string,
  };

  constructor(props) {
    super();

    // Keep a cached version of the value, this cache will be updated when the
    // editor is updated, which can later be used to protect the editor from
    // unnecessary updates during the update lifecycle.
    this.cachedValue = props.value || '';
  }

  async componentDidMount() {
    // Lazily import to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const { default: CodeMirror } = await import(
      /* webpackChunkName: "codemirror" */
      /* webpackMode: "lazy" */
      /* webpackPrefetch: true */
      /* webpackPreload: true */
      'codemirror'
    );
    await Promise.all([
      import('codemirror/addon/hint/show-hint'),
      import('codemirror/addon/edit/matchbrackets'),
      import('codemirror/addon/edit/closebrackets'),
      import('codemirror/addon/fold/brace-fold'),
      import('codemirror/addon/fold/foldgutter'),
      import('codemirror/addon/lint/lint'),
      import('codemirror/addon/search/searchcursor'),
      import('codemirror/addon/search/jump-to-line'),
      import('codemirror/addon/dialog/dialog'),
      import('codemirror/keymap/sublime'),
      import('codemirror-graphql/esm/variables/hint'),
      import('codemirror-graphql/esm/variables/lint'),
      import('codemirror-graphql/esm/variables/mode'),
    ]);
    this.editor = CodeMirror(this._node, {
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
    });
    this.editor.on('change', this._onEdit);
    this.editor.on('keyup', this._onKeyUp);
    this.editor.on('hasCompletion', this._onHasCompletion);
  }

  async componentDidUpdate(prevProps) {
    const { default: CodeMirror } = await import(
      /* webpackChunkName: "codemirror" */
      /* webpackMode: "lazy" */
      /* webpackPrefetch: true */
      /* webpackPreload: true */
      'codemirror'
    );
    if (this.editor) {
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
  }

  componentWillUnmount() {
    if (this.editor) {
      this.editor.off('change', this._onEdit);
      this.editor.off('keyup', this._onKeyUp);
      this.editor.off('hasCompletion', this._onHasCompletion);
      this.editor = null;
    }
  }

  render() {
    return (
      <div
        className="codemirrorWrap"
        ref={node => {
          this._node = node;
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

  _onKeyUp = (cm, event) => {
    const code = event.keyCode;
    if (
      (code >= 65 && code <= 90) || // letters
      (!event.shiftKey && code >= 48 && code <= 57) || // numbers
      (event.shiftKey && code === 189) || // underscore
      (event.shiftKey && code === 222) // "
    ) {
      this.editor.execCommand('autocomplete');
    }
  };

  _onEdit = () => {
    if (!this.ignoreChangeEvent) {
      this.cachedValue = this.editor.getValue();
      if (this.props.onEdit) {
        this.props.onEdit(this.cachedValue);
      }
    }
  };

  _onHasCompletion = (cm, data) => {
    onHasCompletion(cm, data, this.props.onHintInformationRender);
  };
}
