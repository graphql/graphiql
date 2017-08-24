/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { GraphQLSchema } from 'graphql';
import MD from 'markdown-it';
import { normalizeWhitespace } from '../utility/normalizeWhitespace';
import onHasCompletion from '../utility/onHasCompletion';

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
    onPrettifyQuery: PropTypes.func,
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

  componentDidMount() {
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
        'Cmd-Space': () => this.editor.showHint({ completeSingle: true }),
        'Ctrl-Space': () => this.editor.showHint({ completeSingle: true }),
        'Alt-Space': () => this.editor.showHint({ completeSingle: true }),
        'Shift-Space': () => this.editor.showHint({ completeSingle: true }),

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

        // Persistent search box in Query Editor
        'Cmd-F': 'findPersistent',
        'Ctrl-F': 'findPersistent',

        // Editor improvements
        'Ctrl-Left': 'goSubwordLeft',
        'Ctrl-Right': 'goSubwordRight',
        'Alt-Left': 'goGroupLeft',
        'Alt-Right': 'goGroupRight',
      },
    });

    this.editor.on('change', this._onEdit);
    this.editor.on('keyup', this._onKeyUp);
    this.editor.on('hasCompletion', this._onHasCompletion);
    this.editor.on('beforeChange', this._onBeforeChange);
  }

  componentDidUpdate(prevProps) {
    const CodeMirror = require('codemirror');

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

  componentWillUnmount() {
    this.editor.off('change', this._onEdit);
    this.editor.off('keyup', this._onKeyUp);
    this.editor.off('hasCompletion', this._onHasCompletion);
    this.editor = null;
  }

  render() {
    return (
      <div
        className="query-editor"
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
