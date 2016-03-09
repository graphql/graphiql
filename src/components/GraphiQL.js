/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import {
  buildClientSchema,
  GraphQLSchema,
  parse,
  print,
} from 'graphql';

import { ExecuteButton } from './ExecuteButton';
import { ToolbarButton } from './ToolbarButton';
import { QueryEditor } from './QueryEditor';
import { VariableEditor } from './VariableEditor';
import { ResultViewer } from './ResultViewer';
import { DocExplorer } from './DocExplorer';
import collectVariables from '../utility/collectVariables';
import debounce from '../utility/debounce';
import find from '../utility/find';
import { fillLeafs } from '../utility/fillLeafs';
import { getLeft, getTop } from '../utility/elementPosition';
import {
  introspectionQuery,
  introspectionQuerySansSubscriptions,
} from '../utility/introspectionQueries';


/**
 * GraphiQL
 *
 * This React component is responsible for rendering the GraphiQL editor.
 *
 * Props:
 *
 *   - fetcher: a function which accepts GraphQL-HTTP parameters and returns
 *     a Promise or Observable which resolves to the GraphQL parsed
 *     JSON response.
 *
 *   - schema: a GraphQLSchema instance or `null` if one is not to be used.
 *     If `undefined` is provided, GraphiQL will send an introspection query
 *     using the fetcher to produce a schema.
 *
 *   - query: an optional GraphQL string to use as the initial displayed query,
 *     if `undefined` is provided, the stored query or defaultQuery will
 *     be used.
 *
 *   - variables: an optional GraphQL string to use as the initial displayed
 *     query variables, if `undefined` is provided, the stored variables will
 *     be used.
 *
 *   - response: an optional JSON string to use as the initial displayed
 *     response. If not provided, no response will be initialy shown. You might
 *     provide this if illustrating the result of the initial query.
 *
 *   - storage: an instance of [Storage][] GraphiQL will use to persist state.
 *     Only `getItem` and `setItem` are called. Default: window.localStorage
 *
 *   - defaultQuery: an optional GraphQL string to use when no query is provided
 *     and no stored query exists from a previous session. If `undefined` is
 *     provided, GraphiQL will use its own default query.
 *
 *   - onEditQuery: an optional function which will be called when the Query
 *     editor changes. The argument to the function will be the query string.
 *
 *   - onEditVariables: an optional function which will be called when the Query
 *     varible editor changes. The argument to the function will be the
 *     variables string.
 *
 *   - getDefaultFieldNames: an optional function used to provide default fields
 *     to non-leaf fields which invalidly lack a selection set.
 *     Accepts a GraphQLType instance and returns an array of field names.
 *     If not provided, a default behavior will be used.
 *
 * Children:
 *
 *   - <GraphiQL.Logo> Replace the GraphiQL logo with your own.
 *
 *   - <GraphiQL.Toolbar> Add a custom toolbar above GraphiQL.
 *
 *   - <GraphiQL.ToolbarButton> Add a button to the toolbar above GraphiQL.
 *
 *   - <GraphiQL.Footer> Add a custom footer below GraphiQL Results.
 *
 *
 * [Storage]: https://developer.mozilla.org/en-US/docs/Web/API/Storage
 */
export class GraphiQL extends React.Component {

  static propTypes = {
    fetcher: PropTypes.func.isRequired,
    schema: PropTypes.instanceOf(GraphQLSchema),
    query: PropTypes.string,
    response: PropTypes.string,
    storage: PropTypes.shape({
      getItem: PropTypes.func,
      setItem: PropTypes.func
    }),
    defaultQuery: PropTypes.string,
    variables: PropTypes.string,
    onEditQuery: PropTypes.func,
    onEditVariables: PropTypes.func,
    getDefaultFieldNames: PropTypes.func
  }

  /**
   * Inspect the query, automatically filling in selection sets for non-leaf
   * fields which do not yet have them.
   *
   * @public
   */
  autoCompleteLeafs() {
    var { insertions, result } = fillLeafs(
      this.state.schema,
      this.state.query,
      this.props.getDefaultFieldNames
    );
    if (insertions && insertions.length > 0) {
      var editor = this.refs.queryEditor.getCodeMirror();
      editor.operation(() => {
        var cursor = editor.getCursor();
        var cursorIndex = editor.indexFromPos(cursor);
        editor.setValue(result);
        var added = 0;
        var markers = insertions.map(({ index, string }) => editor.markText(
          editor.posFromIndex(index + added),
          editor.posFromIndex(index + (added += string.length)),
          {
            className: 'autoInsertedLeaf',
            clearOnEnter: true,
            title: 'Automatically added leaf fields'
          }
        ));
        setTimeout(() => markers.forEach(marker => marker.clear()), 7000);
        var newCursorIndex = cursorIndex;
        insertions.forEach(({ index, string }) => {
          if (index < cursorIndex) {
            newCursorIndex += string.length;
          }
        });
        var newCursor = editor.posFromIndex(newCursorIndex);
        editor.setCursor(newCursor);
      });
    }

    return result;
  }

  // Lifecycle

  constructor(props) {
    super(props);

    // Ensure props are correct
    if (typeof props.fetcher !== 'function') {
      throw new TypeError('GraphiQL requires a fetcher function.');
    }

    // Cache the storage instance
    this._storage = props.storage || window.localStorage;

    // Determine the initial query to display.
    const query =
      props.query !== undefined ? props.query :
      this._storageGet('query') !== undefined ? this._storageGet('query') :
      props.defaultQuery !== undefined ? props.defaultQuery :
      defaultQuery;

    // Determine the initial variables to display.
    const variables =
      props.variables !== undefined ? props.variables :
      this._storageGet('variables');

    // Get the initial valid variables.
    let variableToType = getVariableToType(props.schema, query);

    // Initialize state
    this.state = {
      schema: props.schema,
      query,
      variables,
      variableToType,
      response: props.response,
      editorFlex: this._storageGet('editorFlex') || 1,
      variableEditorOpen: Boolean(variables),
      variableEditorHeight: this._storageGet('variableEditorHeight') || 200,
      docsOpen: false,
      docsWidth: this._storageGet('docExplorerWidth') || 350,
      isWaitingForResponse: false,
      subscription: null,
    };

    // Ensure only the last executed editor query is rendered.
    this._editorQueryID = 0;
  }

  componentWillReceiveProps(nextProps) {
    let nextSchema = this.state.schema;
    let nextQuery = this.state.query;
    let nextVariables = this.state.variables;
    let nextVariableToType = this.state.variableToType;
    let nextResponse = this.state.response;
    if (nextProps.schema !== undefined) {
      nextSchema = nextProps.schema;
    }
    if (nextProps.query !== undefined) {
      nextQuery = nextProps.query;
    }
    if (nextProps.variables !== undefined) {
      nextVariables = nextProps.variables;
    }
    if (nextSchema && nextQuery &&
        (nextSchema !== this.state.schema || nextQuery !== this.state.query)) {
      const newVariableToType = getVariableToType(nextSchema, nextQuery);
      if (newVariableToType) {
        nextVariableToType = newVariableToType;
      }
    }
    if (nextProps.response !== undefined) {
      nextResponse = nextProps.response;
    }
    this.setState({
      schema: nextSchema,
      query: nextQuery,
      variables: nextVariables,
      variableToType: nextVariableToType,
      response: nextResponse,
    });
  }

  componentDidMount() {
    // If there is no schema provided via props, fetch one using introspection.
    if (this.state.schema !== undefined) {
      return;
    }

    const fetcher = this.props.fetcher;

    // Try the stock introspection query first, falling back on the
    // sans-subscriptions query for services which do not yet support it.
    const fetch = fetcher({ query: introspectionQuery });
    if (!isPromise(fetch)) {
      console.error('Fetcher did not return a Promise for introspection.');
      return;
    }

    fetch
      .catch(() => fetcher({ query: introspectionQuerySansSubscriptions }))
      .then(result => {
        // If a schema was provided while this fetch was underway, then
        // satisfy the race condition by respecting the already
        // provided schema.
        if (this.state.schema !== undefined) {
          return;
        }

        if (result.data) {
          const schema = buildClientSchema(result.data);
          const newVariableToType = getVariableToType(schema, this.state.query);
          this.setState({
            schema,
            variableToType: newVariableToType || this.state.variableToType
          });
        } else {
          let responseString = typeof result === 'string' ?
            result :
            JSON.stringify(result, null, 2);
          this.setState({ response: responseString });
        }
      })
      .catch(error => {
        this.setState({ response: error && (error.stack || String(error)) });
      });
  }

  componentDidUpdate(prevProps, prevState) {
    // When UI-altering state changes, simulate a window resize event so all
    // CodeMirror instances become properly rendered.
    if (this.state.variableEditorOpen !== prevState.variableEditorOpen ||
        this.state.variableEditorHeight !== prevState.variableEditorHeight) {
      window.dispatchEvent(new Event('resize'));
    }
  }

  render() {
    var children = [];
    React.Children.forEach(this.props.children, child => {
      children.push(child);
    });

    var logo = find(children, child => child.type === GraphiQL.Logo) ||
      <GraphiQL.Logo />;

    var toolbar = find(children, child => child.type === GraphiQL.Toolbar) ||
      <GraphiQL.Toolbar />;

    var footer = find(children, child => child.type === GraphiQL.Footer);

    var queryWrapStyle = {
      WebkitFlex: this.state.editorFlex,
      flex: this.state.editorFlex,
    };

    var docWrapStyle = {
      display: this.state.docsOpen ? 'block' : 'none',
      width: this.state.docsWidth,
    };

    var variableOpen = this.state.variableEditorOpen;
    var variableStyle = {
      height: variableOpen ? this.state.variableEditorHeight : null
    };

    return (
      <div id="graphiql-container">
        <div className="editorWrap">
          <div className="topBarWrap">
            <div className="topBar">
              {logo}
              <ExecuteButton
                isRunning={Boolean(this.state.subscription)}
                onClick={this._runOrStopEditorQuery}
              />
              <GraphiQL.ToolbarButton
                onClick={this._prettifyQuery}
                title="Prettify Query"
                label="Prettify"
              />
              {toolbar}
            </div>
            {!this.state.docsOpen &&
              <button className="docExplorerShow" onClick={this._onToggleDocs}>
                Docs
              </button>
            }
          </div>
          <div
            ref="editorBar"
            className="editorBar"
            onMouseDown={this._onResizeStart}
          >
            <div className="queryWrap" style={queryWrapStyle}>
              <QueryEditor
                ref="queryEditor"
                schema={this.state.schema}
                value={this.state.query}
                onEdit={this._onEditQuery}
                onHintInformationRender={this._onHintInformationRender}
              />
              <div className="variable-editor" style={variableStyle}>
                <div
                  className="variable-editor-title"
                  style={{ cursor: variableOpen ? 'row-resize' : 'n-resize' }}
                  onMouseDown={this._onVariableResizeStart}
                >
                  Query Variables
                </div>
                <VariableEditor
                  value={this.state.variables}
                  variableToType={this.state.variableToType}
                  onEdit={this._onEditVariables}
                  onHintInformationRender={this._onHintInformationRender}
                />
              </div>
            </div>
            <div className="resultWrap">
              {this.state.isWaitingForResponse &&
                <div className="spinner-container">
                  <div className="spinner" />
                </div>
              }
              <ResultViewer ref="result" value={this.state.response} />
              {footer}
            </div>
          </div>
        </div>
        <div className="docExplorerWrap" style={docWrapStyle}>
          <div
            className="docExplorerResizer"
            onMouseDown={this._onDocsResizeStart}
          />
          <DocExplorer ref="docExplorer" schema={this.state.schema}>
            <div className="docExplorerHide" onClick={this._onToggleDocs}>
              &#x2715;
            </div>
          </DocExplorer>
        </div>
      </div>
    );
  }

  // Private methods

  _storageGet(name) {
    return this._storage.getItem('graphiql:' + name);
  }

  _storageSet(name, value) {
    this._storage.setItem('graphiql:' + name, value);
  }

  _fetchQuery(query, variables, cb) {
    const fetcher = this.props.fetcher;
    const fetch = fetcher({ query, variables });

    if (isPromise(fetch)) {
      // If fetcher returned a Promise, then call the callback when the promise
      // resolves, otherwise handle the error.
      fetch.then(cb).catch(error => {
        this.setState({
          isWaitingForResponse: false,
          response: error && (error.stack || String(error))
        });
      });
    } else if (isObservable(fetch)) {
      // If the fetcher returned an Observable, then subscribe to it, calling
      // the callback on each next value, and handling both errors and the
      // completion of the Observable. Returns a Subscription object.
      const subscription = fetch.subscribe({
        next: cb,
        error: error => {
          this.setState({
            isWaitingForResponse: false,
            response: error && (error.stack || String(error)),
            subscription: null
          });
        },
        complete: () => {
          this.setState({
            isWaitingForResponse: false,
            subscription: null
          });
        }
      });

      return subscription;
    } else {
      this.setState({
        isWaitingForResponse: false,
        response: 'Fetcher did not return Promise or Observable.'
      });
    }
  }

  _runOrStopEditorQuery = () => {
    // If there is a current subscription, unsubscribe from it.
    if (this.state.subscription) {
      this.setState({
        isWaitingForResponse: false,
        subscription: null
      });
      this.state.subscription.unsubscribe();
      return;
    }

    this._editorQueryID++;
    const queryID = this._editorQueryID;

    // Use the edited query after autoCompleteLeafs() runs or,
    // in case autoCompletion fails (the function returns undefined),
    // the current query from the editor.
    const editedQuery = this.autoCompleteLeafs() || this.state.query;
    const variables = this.state.variables;

    // _fetchQuery may return a subscription.
    const subscription = this._fetchQuery(editedQuery, variables, result => {
      if (queryID === this._editorQueryID) {
        this.setState({
          isWaitingForResponse: false,
          response: JSON.stringify(result, null, 2),
        });
      }
    });

    this.setState({
      isWaitingForResponse: true,
      response: null,
      subscription
    });
  }

  _prettifyQuery = () => {
    const query = print(parse(this.state.query));
    const editor = this.refs.queryEditor.getCodeMirror();
    editor.setValue(query);
  }

  _onEditQuery = value => {
    if (this.state.schema) {
      this._updateVariableToType(value);
    }
    this._storageSet('query', value);
    this.setState({ query: value });
    if (this.props.onEditQuery) {
      return this.props.onEditQuery(value);
    }
  }

  _updateVariableToType = debounce(500, value => {
    const newVariableToType = getVariableToType(this.state.schema, value);
    if (newVariableToType) {
      this.setState({ variableToType: newVariableToType });
    }
  })

  _onEditVariables = value => {
    this._storageSet('variables', value);
    this.setState({ variables: value });
    if (this.props.onEditVariables) {
      this.props.onEditVariables(value);
    }
  }

  _onHintInformationRender = elem => {
    elem.addEventListener('click', this._onClickHintInformation);

    var onRemoveFn;
    elem.addEventListener('DOMNodeRemoved', onRemoveFn = () => {
      elem.removeEventListener('DOMNodeRemoved', onRemoveFn);
      elem.removeEventListener('click', this._onClickHintInformation);
    });
  }

  _onClickHintInformation = event => {
    if (event.target.className === 'typeName') {
      var typeName = event.target.innerHTML;
      var schema = this.state.schema;
      if (schema) {
        var type = schema.getType(typeName);
        if (type) {
          this.setState({ docsOpen: true }, () => {
            this.refs.docExplorer.showDoc(type);
          });
        }
      }
    }
  }

  _onToggleDocs = () => {
    this.setState({ docsOpen: !this.state.docsOpen });
  }

  _onResizeStart = downEvent => {
    if (!this._didClickDragBar(downEvent)) {
      return;
    }

    downEvent.preventDefault();

    var offset = downEvent.clientX - getLeft(downEvent.target);

    var onMouseMove = moveEvent => {
      if (moveEvent.buttons === 0) {
        return onMouseUp();
      }

      var editorBar = ReactDOM.findDOMNode(this.refs.editorBar);
      var leftSize = moveEvent.clientX - getLeft(editorBar) - offset;
      var rightSize = editorBar.clientWidth - leftSize;
      this.setState({ editorFlex: leftSize / rightSize });
    };

    var onMouseUp = () => {
      this._storageSet('editorFlex', this.state.editorFlex);

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      onMouseMove = null;
      onMouseUp = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  _didClickDragBar(event) {
    // Only for primary unmodified clicks
    if (event.button !== 0 || event.ctrlKey) {
      return false;
    }
    var target = event.target;
    // We use codemirror's gutter as the drag bar.
    if (target.className.indexOf('CodeMirror-gutter') !== 0) {
      return false;
    }
    // Specifically the result window's drag bar.
    var resultWindow = ReactDOM.findDOMNode(this.refs.result);
    while (target) {
      if (target === resultWindow) {
        return true;
      }
      target = target.parentNode;
    }
    return false;
  }

  _onDocsResizeStart = downEvent => {
    downEvent.preventDefault();

    var hadWidth = this.state.docsWidth;
    var offset = downEvent.clientX - getLeft(downEvent.target);

    var onMouseMove = moveEvent => {
      if (moveEvent.buttons === 0) {
        return onMouseUp();
      }

      var app = ReactDOM.findDOMNode(this);
      var cursorPos = moveEvent.clientX - getLeft(app) - offset;
      var docsSize = app.clientWidth - cursorPos;

      if (docsSize < 100) {
        this.setState({ docsOpen: false });
      } else {
        this.setState({
          docsOpen: true,
          docsWidth: Math.min(docsSize, 650)
        });
      }
    };

    var onMouseUp = () => {
      if (this.state.docsOpen) {
        this._storageSet('docExplorerWidth', this.state.docsWidth);
      } else {
        this.setState({ docsWidth: hadWidth });
      }

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      onMouseMove = null;
      onMouseUp = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  _onVariableResizeStart = downEvent => {
    downEvent.preventDefault();

    var didMove = false;
    var wasOpen = this.state.variableEditorOpen;
    var hadHeight = this.state.variableEditorHeight;
    var offset = downEvent.clientY - getTop(downEvent.target);

    var onMouseMove = moveEvent => {
      if (moveEvent.buttons === 0) {
        return onMouseUp();
      }

      didMove = true;

      var editorBar = ReactDOM.findDOMNode(this.refs.editorBar);
      var topSize = moveEvent.clientY - getTop(editorBar) - offset;
      var bottomSize = editorBar.clientHeight - topSize;
      if (bottomSize < 60) {
        this.setState({
          variableEditorOpen: false,
          variableEditorHeight: hadHeight
        });
      } else {
        this.setState({
          variableEditorOpen: true,
          variableEditorHeight: bottomSize
        });
      }
    };

    var onMouseUp = () => {
      if (didMove) {
        this._storageSet(
          'variableEditorHeight',
          this.state.variableEditorHeight
        );
      } else {
        this.setState({ variableEditorOpen: !wasOpen });
      }

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      onMouseMove = null;
      onMouseUp = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Logo = class GraphiQLLogo extends React.Component {
  render() {
    return (
      <div className="title">
        {this.props.children || <span>Graph<em>i</em>QL</span>}
      </div>
    );
  }
};

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Toolbar = class GraphiQLToolbar extends React.Component {
  render() {
    return (
      <div className="toolbar">
        {this.props.children}
      </div>
    );
  }
};

// Add a button to the Toolbar.
GraphiQL.ToolbarButton = ToolbarButton;

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Footer = class GraphiQLFooter extends React.Component {
  render() {
    return (
      <div className="footer">
        {this.props.children}
      </div>
    );
  }
};

const defaultQuery =
`# Welcome to GraphiQL
#
# GraphiQL is an in-browser IDE for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will
# see intelligent typeaheads aware of the current GraphQL type schema and
# live syntax and validation errors highlighted within the text.
#
# To bring up the auto-complete at any point, just press Ctrl-Space.
#
# Press the run button above, or Cmd-Enter to execute the query, and the result
# will appear in the pane to the right.

`;

// Returns a `variableToType` mapping, or null not possible.
function getVariableToType(schema, query) {
  if (schema && query) {
    try {
      return collectVariables(schema, parse(query));
    } catch (e) {
      // No op.
    }
  }
}

// Duck-type promise detection.
function isPromise(value) {
  return typeof value === 'object' && typeof value.then === 'function';
}

// Duck-type observable detection.
function isObservable(value) {
  return typeof value === 'object' && typeof value.subscribe === 'function';
}
