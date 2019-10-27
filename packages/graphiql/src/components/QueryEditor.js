/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { GraphQLSchema } from 'graphql';
import MD from 'markdown-it';
import { normalizeWhitespace } from '../utility/normalizeWhitespace';
import onHasCompletion from '../utility/onHasCompletion';
import commonKeys from '../utility/commonKeys';

const md = new MD();
const AUTO_COMPLETE_AFTER_KEY = /^[a-zA-Z0-9_@(]$/;

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
export class QueryEditor extends React.Component {
  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
    value: PropTypes.string,
    onEdit: PropTypes.func,
    readOnly: PropTypes.bool,
    onHintInformationRender: PropTypes.func,
    onClickReference: PropTypes.func,
    onCopyQuery: PropTypes.func,
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
    const { default: CodeMirror } = await import(
      /* webpackChunkName: "codemirror" */
      /* webpackMode: "lazy" */
      /* webpackPrefetch: true */
      /* webpackPreload: true */
      'codemirror'
    );
    await Promise.all([
      import('codemirror/addon/hint/show-hint'),
      import('codemirror/addon/comment/comment'),
      import('codemirror/addon/edit/matchbrackets'),
      import('codemirror/addon/edit/closebrackets'),
      import('codemirror/addon/fold/foldgutter'),
      import('codemirror/addon/fold/brace-fold'),
      import('codemirror/addon/search/search'),
      import('codemirror/addon/search/searchcursor'),
      import('codemirror/addon/search/jump-to-line'),
      import('codemirror/addon/dialog/dialog'),
      import('codemirror/addon/lint/lint'),
      import('codemirror/keymap/sublime'),
      import('codemirror-graphql/hint'),
      import('codemirror-graphql/lint'),
      import('codemirror-graphql/info'),
      import('codemirror-graphql/jump'),
      import('codemirror-graphql/mode'),
    ]);
    this.editor = CodeMirror(this._node, {
      value: this.props.value || '',
      lineNumbers: true,
      tabSize: 2,
      mode: 'graphql',
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
        schema: this.props.schema,
      },
      hintOptions: {
        schema: this.props.schema,
        closeOnUnfocus: false,
        completeSingle: false,
        container: this._node,
      },
      info: {
        schema: this.props.schema,
        renderDescription: text => md.render(text),
        onClick: reference => this.props.onClickReference(reference),
      },
      jump: {
        schema: this.props.schema,
        onClick: reference => this.props.onClickReference(reference),
      },
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Cmd-Space': () =>
          this.editor.showHint({ completeSingle: true, container: this._node }),
        'Ctrl-Space': () =>
          this.editor.showHint({ completeSingle: true, container: this._node }),
        'Alt-Space': () =>
          this.editor.showHint({ completeSingle: true, container: this._node }),
        'Shift-Space': () =>
          this.editor.showHint({ completeSingle: true, container: this._node }),
        'Shift-Alt-Space': () =>
          this.editor.showHint({ completeSingle: true, container: this._node }),

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

        'Shift-Ctrl-C': () => {
          if (this.props.onCopyQuery) {
            this.props.onCopyQuery();
          }
        },

        'Shift-Ctrl-P': () => {
          if (this.props.onPrettifyQuery) {
            this.props.onPrettifyQuery();
          }
        },

        /* Shift-Ctrl-P is hard coded in Firefox for private browsing so adding an alternative to Pretiffy */

        'Shift-Ctrl-F': () => {
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
    this.editor.on('beforeChange', this._onBeforeChange);
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
      if (this.props.schema !== prevProps.schema) {
        this.editor.options.lint.schema = this.props.schema;
        this.editor.options.hintOptions.schema = this.props.schema;
        this.editor.options.info.schema = this.props.schema;
        this.editor.options.jump.schema = this.props.schema;
        CodeMirror.signal(this.editor, 'change', this.editor);
      }
      if (
        this.props.value !== prevProps.value &&
        this.props.value !== this.cachedValue
      ) {
        this.cachedValue = this.props.value;
        this.editor.setValue(this.props.value);
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
      <section
        className="query-editor"
        aria-label="Query Editor"
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
    if (AUTO_COMPLETE_AFTER_KEY.test(event.key)) {
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

  /**
   * Render a custom UI for CodeMirror's hint which includes additional info
   * about the type and description for the selected context.
   */
  _onHasCompletion = (cm, data) => {
    onHasCompletion(cm, data, this.props.onHintInformationRender);
  };

  _onBeforeChange(instance, change) {
    // The update function is only present on non-redo, non-undo events.
    if (change.origin === 'paste') {
      const text = change.text.map(normalizeWhitespace);
      change.update(change.from, change.to, text);
    }
  }
}
