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
import CodeMirrorSizer from '../utility/CodeMirrorSizer';
import getQueryFacts from '../utility/getQueryFacts';
import getSelectedOperationName from '../utility/getSelectedOperationName';
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
 *   - operationName: an optional name of which GraphQL operation should be
 *     executed.
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
 *   - onEditOperationName: an optional function which will be called when the
 *     operation name to be executed changes.
 *
 *   - onToggleDocs: an optional function which will be called when the
 *     docs will be toggled. The argument to the function will be a boolean
 *     whether the docs are now open or closed.
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
    variables: PropTypes.string,
    operationName: PropTypes.string,
    response: PropTypes.string,
    storage: PropTypes.shape({
      getItem: PropTypes.func,
      setItem: PropTypes.func
    }),
    defaultQuery: PropTypes.string,
    onEditQuery: PropTypes.func,
    onEditVariables: PropTypes.func,
    onEditOperationName: PropTypes.func,
    onToggleDocs: PropTypes.func,
    getDefaultFieldNames: PropTypes.func
  }

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
      this._storageGet('query') !== null ? this._storageGet('query') :
      props.defaultQuery !== undefined ? props.defaultQuery :
      defaultQuery;

    // Get the initial query facts.
    const queryFacts = getQueryFacts(props.schema, query);

    // Determine the initial variables to display.
    const variables =
      props.variables !== undefined ? props.variables :
      this._storageGet('variables');

    // Determine the initial operationName to use.
    const operationName =
      props.operationName !== undefined ? props.operationName :
      getSelectedOperationName(
        null,
        this._storageGet('operationName'),
        queryFacts && queryFacts.operations
      );

    // Initialize state
    this.state = {
      schema: props.schema,
      query,
      variables,
      operationName,
      response: props.response,
      editorFlex: Number(this._storageGet('editorFlex')) || 1,
      variableEditorOpen: Boolean(variables),
      variableEditorHeight:
        Number(this._storageGet('variableEditorHeight')) || 200,
      docExplorerOpen:
        (this._storageGet('docExplorerOpen') === 'true') || false,
      docExplorerWidth: Number(this._storageGet('docExplorerWidth')) || 350,
      isWaitingForResponse: false,
      subscription: null,
      ...queryFacts
    };

    // Ensure only the last executed editor query is rendered.
    this._editorQueryID = 0;

    // Subscribe to the browser window closing, treating it as an unmount.
    if (typeof window === 'object') {
      window.addEventListener('beforeunload', () =>
        this.componentWillUnmount()
      );
    }
  }

  componentDidMount() {
    // Ensure a form of a schema exists (including `null`) and
    // if not, fetch one using an introspection query.
    this._ensureOfSchema();

    // Utility for keeping CodeMirror correctly sized.
    this.codeMirrorSizer = new CodeMirrorSizer();
  }

  componentWillReceiveProps(nextProps) {
    let nextSchema = this.state.schema;
    let nextQuery = this.state.query;
    let nextVariables = this.state.variables;
    let nextOperationName = this.state.operationName;
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
    if (nextProps.operationName !== undefined) {
      nextOperationName = nextProps.operationName;
    }
    if (nextProps.response !== undefined) {
      nextResponse = nextProps.response;
    }
    if (nextSchema !== this.state.schema ||
        nextQuery !== this.state.query ||
        nextOperationName !== this.state.operationName) {
      this._updateQueryFacts(nextQuery);
    }

    this.setState({
      schema: nextSchema,
      query: nextQuery,
      variables: nextVariables,
      operationName: nextOperationName,
      response: nextResponse,
    });
  }

  componentDidUpdate() {
    // If this update caused DOM nodes to have changed sizes, update the
    // corresponding CodeMirror instance sizes to match.
    this.codeMirrorSizer.updateSizes([
      this.queryEditorComponent,
      this.variableEditorComponent,
      this.resultComponent,
    ]);
  }

  // When the component is about to unmount, store any persistable state, such
  // that when the component is remounted, it will use the last used values.
  componentWillUnmount() {
    this._storageSet('query', this.state.query);
    this._storageSet('variables', this.state.variables || '');
    this._storageSet('operationName', this.state.operationName);
    this._storageSet('editorFlex', this.state.editorFlex);
    this._storageSet('variableEditorHeight', this.state.variableEditorHeight);
    this._storageSet('docExplorerWidth', this.state.docExplorerWidth);
    this._storageSet('docExplorerOpen', this.state.docExplorerOpen);
  }

  render() {
    const children = React.Children.toArray(this.props.children);

    const logo =
      find(children, child => child.type === GraphiQL.Logo) ||
      <GraphiQL.Logo />;

    const toolbar =
      find(children, child => child.type === GraphiQL.Toolbar) ||
      <GraphiQL.Toolbar />;

    const footer = find(children, child => child.type === GraphiQL.Footer);

    const queryWrapStyle = {
      WebkitFlex: this.state.editorFlex,
      flex: this.state.editorFlex,
    };

    const docWrapStyle = {
      display: this.state.docExplorerOpen ? 'block' : 'none',
      width: this.state.docExplorerWidth,
    };

    const variableOpen = this.state.variableEditorOpen;
    const variableStyle = {
      height: variableOpen ? this.state.variableEditorHeight : null
    };

    return (
      <div className="graphiql-container">
        <div className="editorWrap">
          <div className="topBarWrap">
            <div className="topBar">
              {logo}
              <ExecuteButton
                isRunning={Boolean(this.state.subscription)}
                onRun={this.handleRunQuery}
                onStop={this.handleStopQuery}
                operations={this.state.operations}
              />
              <GraphiQL.ToolbarButton
                onClick={this.handlePrettifyQuery}
                title="Prettify Query"
                label="Prettify"
              />
              {toolbar}
            </div>
            {
              !this.state.docExplorerOpen &&
              <button
                className="docExplorerShow"
                onClick={this.handleToggleDocs}>
                {'Docs'}
              </button>
            }
          </div>
          <div
            ref={n => { this.editorBarComponent = n; }}
            className="editorBar"
            onMouseDown={this.handleResizeStart}>
            <div className="queryWrap" style={queryWrapStyle}>
              <QueryEditor
                ref={n => { this.queryEditorComponent = n; }}
                schema={this.state.schema}
                value={this.state.query}
                onEdit={this.handleEditQuery}
                onHintInformationRender={this.handleHintInformationRender}
                onRunQuery={this.handleEditorRunQuery}
              />
              <div className="variable-editor" style={variableStyle}>
                <div
                  className="variable-editor-title"
                  style={{ cursor: variableOpen ? 'row-resize' : 'n-resize' }}
                  onMouseDown={this.handleVariableResizeStart}>
                  {'Query Variables'}
                </div>
                <VariableEditor
                  ref={n => { this.variableEditorComponent = n; }}
                  value={this.state.variables}
                  variableToType={this.state.variableToType}
                  onEdit={this.handleEditVariables}
                  onHintInformationRender={this.handleHintInformationRender}
                  onRunQuery={this.handleEditorRunQuery}
                />
              </div>
            </div>
            <div className="resultWrap">
              {
                this.state.isWaitingForResponse &&
                <div className="spinner-container">
                  <div className="spinner" />
                </div>
              }
              <ResultViewer
                ref={c => { this.resultComponent = c; }}
                value={this.state.response}
              />
              {footer}
            </div>
          </div>
        </div>
        <div className="docExplorerWrap" style={docWrapStyle}>
          <div
            className="docExplorerResizer"
            onMouseDown={this.handleDocsResizeStart}
          />
          <DocExplorer
            ref={c => { this.docExplorerComponent = c; }}
            schema={this.state.schema}>
            <div className="docExplorerHide" onClick={this.handleToggleDocs}>
              {'\u2715'}
            </div>
          </DocExplorer>
        </div>
      </div>
    );
  }

  /**
   * Inspect the query, automatically filling in selection sets for non-leaf
   * fields which do not yet have them.
   *
   * @public
   */
  autoCompleteLeafs() {
    const { insertions, result } = fillLeafs(
      this.state.schema,
      this.state.query,
      this.props.getDefaultFieldNames
    );
    if (insertions && insertions.length > 0) {
      const editor = this.queryEditorComponent.getCodeMirror();
      editor.operation(() => {
        const cursor = editor.getCursor();
        const cursorIndex = editor.indexFromPos(cursor);
        editor.setValue(result);
        let added = 0;
        const markers = insertions.map(({ index, string }) => editor.markText(
          editor.posFromIndex(index + added),
          editor.posFromIndex(index + (added += string.length)),
          {
            className: 'autoInsertedLeaf',
            clearOnEnter: true,
            title: 'Automatically added leaf fields'
          }
        ));
        setTimeout(() => markers.forEach(marker => marker.clear()), 7000);
        let newCursorIndex = cursorIndex;
        insertions.forEach(({ index, string }) => {
          if (index < cursorIndex) {
            newCursorIndex += string.length;
          }
        });
        editor.setCursor(editor.posFromIndex(newCursorIndex));
      });
    }

    return result;
  }

  // Private methods

  _ensureOfSchema() {
    // Only perform introspection if a schema is not provided (undefined)
    if (this.state.schema !== undefined) {
      return;
    }

    const fetcher = this.props.fetcher;

    const fetch = observableToPromise(fetcher({ query: introspectionQuery }));
    if (!isPromise(fetch)) {
      this.setState({
        response: 'Fetcher did not return a Promise for introspection.'
      });
      return;
    }

    fetch.then(result => {
      if (result.data) {
        return result;
      }

      // Try the stock introspection query first, falling back on the
      // sans-subscriptions query for services which do not yet support it.
      const fetch2 = observableToPromise(fetcher({
        query: introspectionQuerySansSubscriptions
      }));
      if (!isPromise(fetch)) {
        throw new Error('Fetcher did not return a Promise for introspection.');
      }
      return fetch2;
    }).then(result => {
      // If a schema was provided while this fetch was underway, then
      // satisfy the race condition by respecting the already
      // provided schema.
      if (this.state.schema !== undefined) {
        return;
      }

      if (result && result.data) {
        const schema = buildClientSchema(result.data);
        const queryFacts = getQueryFacts(schema, this.state.query);
        this.setState({ schema, ...queryFacts });
      } else {
        const responseString = typeof result === 'string' ?
          result :
          JSON.stringify(result, null, 2);
        this.setState({ response: responseString });
      }
    }).catch(error => {
      this.setState({ response: error && String(error.stack || error) });
    });
  }

  _storageGet(name) {
    return this._storage && this._storage.getItem('graphiql:' + name);
  }

  _storageSet(name, value) {
    if (this._storage) {
      this._storage.setItem('graphiql:' + name, value);
    }
  }

  _fetchQuery(query, variables, operationName, cb) {
    const fetcher = this.props.fetcher;
    let jsonVariables = null;

    try {
      jsonVariables =
        variables && variables.trim() !== '' ? JSON.parse(variables) : null;
    } catch (error) {
      throw new Error(`Variables are invalid JSON: ${error.message}.`);
    }

    if (typeof jsonVariables !== 'object') {
      throw new Error('Variables are not a JSON object.');
    }

    const fetch = fetcher({
      query,
      variables: jsonVariables,
      operationName
    });

    if (isPromise(fetch)) {
      // If fetcher returned a Promise, then call the callback when the promise
      // resolves, otherwise handle the error.
      fetch.then(cb).catch(error => {
        this.setState({
          isWaitingForResponse: false,
          response: error && String(error.stack || error)
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
            response: error && String(error.stack || error),
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
      throw new Error('Fetcher did not return Promise or Observable.');
    }
  }

  handleRunQuery = selectedOperationName => {
    this._editorQueryID++;
    const queryID = this._editorQueryID;

    // Use the edited query after autoCompleteLeafs() runs or,
    // in case autoCompletion fails (the function returns undefined),
    // the current query from the editor.
    const editedQuery = this.autoCompleteLeafs() || this.state.query;
    const variables = this.state.variables;
    let operationName = this.state.operationName;

    // If an operation was explicitly provided, different from the current
    // operation name, then report that it changed.
    if (selectedOperationName && selectedOperationName !== operationName) {
      operationName = selectedOperationName;
      const onEditOperationName = this.props.onEditOperationName;
      if (onEditOperationName) {
        onEditOperationName(operationName);
      }
    }

    try {
      this.setState({
        isWaitingForResponse: true,
        response: null,
        operationName,
      });

      // _fetchQuery may return a subscription.
      const subscription = this._fetchQuery(
        editedQuery,
        variables,
        operationName,
        result => {
          if (queryID === this._editorQueryID) {
            this.setState({
              isWaitingForResponse: false,
              response: JSON.stringify(result, null, 2),
            });
          }
        }
      );

      this.setState({ subscription });
    } catch (error) {
      this.setState({
        isWaitingForResponse: false,
        response: error.message
      });
    }
  }

  handleStopQuery = () => {
    const subscription = this.state.subscription;
    this.setState({
      isWaitingForResponse: false,
      subscription: null
    });
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  _runQueryAtCursor() {
    if (this.state.subscription) {
      this.handleStopQuery();
      return;
    }

    let operationName;
    const operations = this.state.operations;
    if (operations) {
      const editor = this.queryEditorComponent.getCodeMirror();
      if (editor.hasFocus()) {
        const cursor = editor.getCursor();
        const cursorIndex = editor.indexFromPos(cursor);

        // Loop through all operations to see if one contains the cursor.
        for (let i = 0; i < operations.length; i++) {
          const operation = operations[i];
          if (operation.loc.start <= cursorIndex &&
              operation.loc.end >= cursorIndex) {
            operationName = operation.name && operation.name.value;
            break;
          }
        }
      }
    }

    this.handleRunQuery(operationName);
  }

  handlePrettifyQuery = () => {
    const query = print(parse(this.state.query));
    const editor = this.queryEditorComponent.getCodeMirror();
    editor.setValue(query);
  }

  handleEditQuery = value => {
    if (this.state.schema) {
      this._updateQueryFacts(value);
    }
    this.setState({ query: value });
    if (this.props.onEditQuery) {
      return this.props.onEditQuery(value);
    }
  }

  _updateQueryFacts = debounce(150, query => {
    const queryFacts = getQueryFacts(this.state.schema, query);
    if (queryFacts) {
      // Update operation name should any query names change.
      const operationName = getSelectedOperationName(
        this.state.operations,
        this.state.operationName,
        queryFacts.operations
      );

      // Report changing of operationName if it changed.
      const onEditOperationName = this.props.onEditOperationName;
      if (onEditOperationName && operationName !== this.state.operationName) {
        onEditOperationName(operationName);
      }

      this.setState({
        operationName,
        ...queryFacts
      });
    }
  })

  handleEditVariables = value => {
    this.setState({ variables: value });
    if (this.props.onEditVariables) {
      this.props.onEditVariables(value);
    }
  }

  handleHintInformationRender = elem => {
    elem.addEventListener('click', this._onClickHintInformation);

    let onRemoveFn;
    elem.addEventListener('DOMNodeRemoved', onRemoveFn = () => {
      elem.removeEventListener('DOMNodeRemoved', onRemoveFn);
      elem.removeEventListener('click', this._onClickHintInformation);
    });
  }

  handleEditorRunQuery = () => {
    this._runQueryAtCursor();
  }

  _onClickHintInformation = event => {
    if (event.target.className === 'typeName') {
      const typeName = event.target.innerHTML;
      const schema = this.state.schema;
      if (schema) {
        const type = schema.getType(typeName);
        if (type) {
          this.setState({ docExplorerOpen: true }, () => {
            this.docExplorerComponent.showDoc(type);
          });
        }
      }
    }
  }

  handleToggleDocs = () => {
    if (typeof this.props.onToggleDocs === 'function') {
      this.props.onToggleDocs(!this.state.docExplorerOpen);
    }
    this.setState({ docExplorerOpen: !this.state.docExplorerOpen });
  }

  handleResizeStart = downEvent => {
    if (!this._didClickDragBar(downEvent)) {
      return;
    }

    downEvent.preventDefault();

    const offset = downEvent.clientX - getLeft(downEvent.target);

    let onMouseMove = moveEvent => {
      if (moveEvent.buttons === 0) {
        return onMouseUp();
      }

      const editorBar = ReactDOM.findDOMNode(this.editorBarComponent);
      const leftSize = moveEvent.clientX - getLeft(editorBar) - offset;
      const rightSize = editorBar.clientWidth - leftSize;
      this.setState({ editorFlex: leftSize / rightSize });
    };

    let onMouseUp = () => {
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
    let target = event.target;
    // We use codemirror's gutter as the drag bar.
    if (target.className.indexOf('CodeMirror-gutter') !== 0) {
      return false;
    }
    // Specifically the result window's drag bar.
    const resultWindow = ReactDOM.findDOMNode(this.resultComponent);
    while (target) {
      if (target === resultWindow) {
        return true;
      }
      target = target.parentNode;
    }
    return false;
  }

  handleDocsResizeStart = downEvent => {
    downEvent.preventDefault();

    const hadWidth = this.state.docExplorerWidth;
    const offset = downEvent.clientX - getLeft(downEvent.target);

    let onMouseMove = moveEvent => {
      if (moveEvent.buttons === 0) {
        return onMouseUp();
      }

      const app = ReactDOM.findDOMNode(this);
      const cursorPos = moveEvent.clientX - getLeft(app) - offset;
      const docsSize = app.clientWidth - cursorPos;

      if (docsSize < 100) {
        this.setState({ docExplorerOpen: false });
      } else {
        this.setState({
          docExplorerOpen: true,
          docExplorerWidth: Math.min(docsSize, 650)
        });
      }
    };

    let onMouseUp = () => {
      if (!this.state.docExplorerOpen) {
        this.setState({ docExplorerWidth: hadWidth });
      }

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      onMouseMove = null;
      onMouseUp = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  handleVariableResizeStart = downEvent => {
    downEvent.preventDefault();

    let didMove = false;
    const wasOpen = this.state.variableEditorOpen;
    const hadHeight = this.state.variableEditorHeight;
    const offset = downEvent.clientY - getTop(downEvent.target);

    let onMouseMove = moveEvent => {
      if (moveEvent.buttons === 0) {
        return onMouseUp();
      }

      didMove = true;

      const editorBar = ReactDOM.findDOMNode(this.editorBarComponent);
      const topSize = moveEvent.clientY - getTop(editorBar) - offset;
      const bottomSize = editorBar.clientHeight - topSize;
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

    let onMouseUp = () => {
      if (!didMove) {
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
GraphiQL.Logo = function GraphiQLLogo(props) {
  return (
    <div className="title">
      {props.children || <span>{'Graph'}<em>{'i'}</em>{'QL'}</span>}
    </div>
  );
};

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Toolbar = function GraphiQLToolbar(props) {
  return (
    <div className="toolbar">
      {props.children}
    </div>
  );
};

// Add a button to the Toolbar.
GraphiQL.ToolbarButton = ToolbarButton;

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Footer = function GraphiQLFooter(props) {
  return (
    <div className="footer">
      {props.children}
    </div>
  );
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

// Duck-type promise detection.
function isPromise(value) {
  return typeof value === 'object' && typeof value.then === 'function';
}

// Duck-type Observable.take(1).toPromise()
function observableToPromise(observable) {
  if ( !isObservable(observable) ) {
    return observable;
  }
  return new Promise((resolve, reject) => {
    const subscription = observable.subscribe(
      v => {
        resolve(v);
        subscription.unsubscribe();
      },
      reject,
      () => {
        reject(new Error('no value resolved'));
      }
    );
  });
}

// Duck-type observable detection.
function isObservable(value) {
  return typeof value === 'object' && typeof value.subscribe === 'function';
}
