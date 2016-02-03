/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import marked from 'marked';
import CodeMirror from 'codemirror';
import { GraphQLSchema, GraphQLNonNull, GraphQLList } from 'graphql';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/lint/lint';
import 'codemirror/keymap/sublime';
import 'codemirror-graphql/hint';
import 'codemirror-graphql/lint';
import 'codemirror-graphql/mode';


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
 *
 */
export class QueryEditor extends React.Component {
  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
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

  /**
   * Public API for retrieving the CodeMirror instance from this
   * React component.
   */
  getCodeMirror() {
    return this.editor;
  }

  componentDidMount() {
    this.editor = CodeMirror(ReactDOM.findDOMNode(this), {
      value: this.props.value || '',
      lineNumbers: true,
      tabSize: 2,
      mode: 'graphql',
      theme: 'graphiql',
      keyMap: 'sublime',
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      foldGutter: {
        minFoldSize: 4
      },
      lint: {
        schema: this.props.schema,
      },
      hintOptions: {
        schema: this.props.schema,
        closeOnUnfocus: false,
        completeSingle: false,
      },
      gutters: [ 'CodeMirror-linenumbers', 'CodeMirror-foldgutter' ],
      extraKeys: {
        'Cmd-Space': () => this.editor.showHint({ completeSingle: true }),
        'Ctrl-Space': () => this.editor.showHint({ completeSingle: true }),
        'Alt-Space': () => this.editor.showHint({ completeSingle: true }),
        'Shift-Space': () => this.editor.showHint({ completeSingle: true }),

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
    if (this.props.schema !== prevProps.schema) {
      this.editor.options.lint.schema = this.props.schema;
      this.editor.options.hintOptions.schema = this.props.schema;
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
      (event.shiftKey && code === 50) || // @
      (event.shiftKey && code === 57) // (
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

  /**
   * Render a custom UI for CodeMirror's hint which includes additional info
   * about the type and description for the selected context.
   */
  _onHasCompletion = (cm, data) => {
    var wrapper;
    var information;

    // When a hint result is selected, we touch the UI.
    CodeMirror.on(data, 'select', (ctx, el) => {
      // Only the first time (usually when the hint UI is first displayed)
      // do we create the wrapping node.
      if (!wrapper) {
        // Wrap the existing hint UI, so we have a place to put information.
        var hintsUl = el.parentNode;
        var container = hintsUl.parentNode;
        wrapper = document.createElement('div');
        container.appendChild(wrapper);

        // CodeMirror vertically inverts the hint UI if there is not enough
        // space below the cursor. Since this modified UI appends to the bottom
        // of CodeMirror's existing UI, it could cover the cursor. This adjusts
        // the positioning of the hint UI to accomodate.
        var top = hintsUl.style.top;
        var bottom = '';
        var cursorTop = cm.cursorCoords().top;
        if (parseInt(top, 10) < cursorTop) {
          top = '';
          bottom = (window.innerHeight - cursorTop + 3) + 'px';
        }

        // Style the wrapper, remove positioning from hints. Note that usage
        // of this option will need to specify CSS to remove some styles from
        // the existing hint UI.
        wrapper.className = 'CodeMirror-hints-wrapper';
        wrapper.style.left = hintsUl.style.left;
        wrapper.style.top = top;
        wrapper.style.bottom = bottom;
        hintsUl.style.left = '';
        hintsUl.style.top = '';

        // This "information" node will contain the additional info about the
        // highlighted typeahead option.
        information = document.createElement('div');
        information.className = 'CodeMirror-hint-information';
        if (bottom) {
          wrapper.appendChild(information);
          wrapper.appendChild(hintsUl);
        } else {
          wrapper.appendChild(hintsUl);
          wrapper.appendChild(information);
        }

        // When CodeMirror attempts to remove the hint UI, we detect that it was
        // removed from our wrapper and in turn remove the wrapper from the
        // original container.
        var onRemoveFn;
        wrapper.addEventListener('DOMNodeRemoved', onRemoveFn = event => {
          if (event.target === hintsUl) {
            wrapper.removeEventListener('DOMNodeRemoved', onRemoveFn);
            wrapper.parentNode.removeChild(wrapper);
            wrapper = null;
            information = null;
            onRemoveFn = null;
          }
        });
      }

      // Now that the UI has been set up, add info to information.
      var description = ctx.description ?
        marked(ctx.description, { smartypants: true }) :
        'Self descriptive.';
      var type = ctx.type ?
        '<span class="infoType">' + renderType(ctx.type) + '</span>' :
        '';

      information.innerHTML = '<div class="content">' +
        (description.slice(0, 3) === '<p>' ?
          '<p>' + type + description.slice(3) :
          type + description) + '</div>';

      // Additional rendering?
      var onHintInformationRender = this.props.onHintInformationRender;
      if (onHintInformationRender) {
        onHintInformationRender(information);
      }
    });
  }

  render() {
    return <div className="query-editor" />;
  }
}

function renderType(type) {
  if (type instanceof GraphQLNonNull) {
    return `${renderType(type.ofType)}!`;
  }
  if (type instanceof GraphQLList) {
    return `[${renderType(type.ofType)}]`;
  }
  return `<a class="typeName">${type.name}</a>`;
}
