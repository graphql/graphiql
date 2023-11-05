/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { buildClientSchema, GraphQLSchema, parse, print } from 'graphql';
import copyToClipboard from 'copy-to-clipboard';

import { ExecuteButton } from './ExecuteButton';
import { ImagePreview } from './ImagePreview';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarMenu, ToolbarMenuItem } from './ToolbarMenu';
import { ToolbarSelect, ToolbarSelectOption } from './ToolbarSelect';
import { QueryEditor } from './QueryEditor';
import { VariableEditor } from './VariableEditor';
import { ResultViewer } from './ResultViewer';
import { DocExplorer } from './DocExplorer';
import { QueryHistory } from './QueryHistory';
import CodeMirrorSizer from '../utility/CodeMirrorSizer';
import StorageAPI from '../utility/StorageAPI';
import getQueryFacts from '../utility/getQueryFacts';
import getSelectedOperationName from '../utility/getSelectedOperationName';
import debounce from '../utility/debounce';
import find from '../utility/find';
import { fillLeafs } from '../utility/fillLeafs';
import { getLeft, getTop } from '../utility/elementPosition';
import { mergeAst } from '../utility/mergeAst';
import {
  introspectionQuery,
  introspectionQueryName,
  introspectionQuerySansSubscriptions,
} from '../utility/introspectionQueries';

const DEFAULT_DOC_EXPLORER_WIDTH = 350;

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */
export class GraphiQL extends React.Component {
  static propTypes = {
    fetcher: PropTypes.func.isRequired,
    schema: PropTypes.instanceOf(GraphQLSchema),
    query: PropTypes.string,
    variables: PropTypes.string,
    headers: PropTypes.string,
    operationName: PropTypes.string,
    response: PropTypes.string,
    storage: PropTypes.shape({
      getItem: PropTypes.func,
      setItem: PropTypes.func,
      removeItem: PropTypes.func,
    }),
    defaultQuery: PropTypes.string,
    onCopyQuery: PropTypes.func,
    onEditQuery: PropTypes.func,
    onEditVariables: PropTypes.func,
    onEditHeaders: PropTypes.func,
    onEditOperationName: PropTypes.func,
    onToggleDocs: PropTypes.func,
    getDefaultFieldNames: PropTypes.func,
    editorTheme: PropTypes.string,
    onToggleHistory: PropTypes.func,
    ResultsTooltip: PropTypes.any,
    readOnly: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    // Ensure props are correct
    if (typeof props.fetcher !== 'function') {
      throw new TypeError('GraphiQL requires a fetcher function.');
    }

    // Cache the storage instance
    this._storage = new StorageAPI(props.storage);

    // Determine the initial query to display.
    const query =
      props.query !== undefined
        ? props.query
        : this._storage.get('query') !== null
        ? this._storage.get('query')
        : props.defaultQuery !== undefined
        ? props.defaultQuery
        : defaultQuery;

    // Get the initial query facts.
    const queryFacts = getQueryFacts(props.schema, query);

    // Determine the initial variables to display.
    const variables = props.variables !== undefined ? props.variables : this._storage.get('variables');
    const headers = props.headers !== undefined ? props.headers : this._storage.get('headers');

    // Determine the initial operationName to use.
    const operationName =
      props.operationName !== undefined
        ? props.operationName
        : getSelectedOperationName(
            null,
            this._storage.get('operationName'),
            queryFacts && queryFacts.operations,
          );

    // Initialize state
    this.state = {
      schema: props.schema,
      query,
      variables,
      headers,
      operationName,
      response: props.response,
      editorFlex: Number(this._storage.get('editorFlex')) || 1,
      variableEditorOpen: Boolean(variables),
      headerEditorOpen: Boolean(headers),
      variableEditorHeight: Number(this._storage.get('variableEditorHeight')) || 200,
      docExplorerOpen: this._storage.get('docExplorerOpen') === 'true' || false,
      historyPaneOpen: this._storage.get('historyPaneOpen') === 'true' || false,
      docExplorerWidth: Number(this._storage.get('docExplorerWidth')) || DEFAULT_DOC_EXPLORER_WIDTH,
      isWaitingForResponse: false,
      subscription: null,
      ...queryFacts,
    };

    // Ensure only the last executed editor query is rendered.
    this._editorQueryID = 0;

    // Subscribe to the browser window closing, treating it as an unmount.
    if (typeof window === 'object') {
      window.addEventListener('beforeunload', () =>
        this.componentWillUnmount(),
      );
    }
  }

  componentDidMount() {
    // Only fetch schema via introspection if a schema has not been
    // provided, including if `null` was provided.
    if (this.state.schema === undefined) {
      this._fetchSchema();
    }

    // Utility for keeping CodeMirror correctly sized.
    this.codeMirrorSizer = new CodeMirrorSizer();

    global.g = this;
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
    if (
      nextSchema !== this.state.schema ||
      nextQuery !== this.state.query ||
      nextOperationName !== this.state.operationName
    ) {
      const updatedQueryAttributes = this._updateQueryFacts(
        nextQuery,
        nextOperationName,
        this.state.operations,
        nextSchema,
      );

      if (updatedQueryAttributes !== undefined) {
        nextOperationName = updatedQueryAttributes.operationName;

        this.setState(updatedQueryAttributes);
      }
    }

    // If schema is not supplied via props and the fetcher changed, then
    // remove the schema so fetchSchema() will be called with the new fetcher.
    if (
      nextProps.schema === undefined &&
      nextProps.fetcher !== this.props.fetcher
    ) {
      nextSchema = undefined;
    }

    this.setState(
      {
        schema: nextSchema,
        query: nextQuery,
        variables: nextVariables,
        operationName: nextOperationName,
        response: nextResponse,
      },
      () => {
        if (this.state.schema === undefined) {
          this.docExplorerComponent.reset();
          this._fetchSchema();
        }
      },
    );
  }

  componentDidUpdate() {
    // If this update caused DOM nodes to have changed sizes, update the
    // corresponding CodeMirror instance sizes to match.
    this.codeMirrorSizer.updateSizes([
      this.queryEditorComponent,
      this.variableEditorComponent,
      // this.headerEditorComponent,
      this.resultComponent,
    ]);
  }

  // When the component is about to unmount, store any persistable state, such
  // that when the component is remounted, it will use the last used values.
  componentWillUnmount() {
    this._storage.set('query', this.state.query);
    this._storage.set('variables', this.state.variables);
    this._storage.set('headers', this.state.headers);
    this._storage.set('operationName', this.state.operationName);
    this._storage.set('editorFlex', this.state.editorFlex);
    this._storage.set('variableEditorHeight', this.state.variableEditorHeight);
    this._storage.set('docExplorerWidth', this.state.docExplorerWidth);
    this._storage.set('docExplorerOpen', this.state.docExplorerOpen);
    this._storage.set('historyPaneOpen', this.state.historyPaneOpen);
  }

  render() {
    const children = React.Children.toArray(this.props.children);

    const logo = find(children, child => child.type === GraphiQL.Logo) || (
      <GraphiQL.Logo />
    );

    const toolbar = find(
      children,
      child => child.type === GraphiQL.Toolbar,
    ) || (
      <GraphiQL.Toolbar>
        <ToolbarButton
          onClick={this.handlePrettifyQuery}
          title="Prettify Query (Shift-Ctrl-P)"
          label="Prettify"
        />
        <ToolbarButton
          onClick={this.handleMergeQuery}
          title="Merge Query (Shift-Ctrl-M)"
          label="Merge"
        />
        <ToolbarButton
          onClick={this.handleCopyQuery}
          title="Copy Query (Shift-Ctrl-C)"
          label="Copy"
        />
        <ToolbarButton
          onClick={this.handleToggleHistory}
          title="Show History"
          label="History"
        />
      </GraphiQL.Toolbar>
    );

    const footer = find(children, child => child.type === GraphiQL.Footer);

    const queryWrapStyle = {
      WebkitFlex: this.state.editorFlex,
      flex: this.state.editorFlex,
    };

    const docWrapStyle = {
      display: this.state.docExplorerOpen ? 'block' : 'none',
      width: this.state.docExplorerWidth,
    };
    const docExplorerWrapClasses =
      'docExplorerWrap' +
      (this.state.docExplorerWidth < 200 ? ' doc-explorer-narrow' : '');

    const historyPaneStyle = {
      display: this.state.historyPaneOpen ? 'block' : 'none',
      width: '230px',
      zIndex: '7',
    };

    const variableOpen = this.state.variableEditorOpen;
    const headerOpen = this.state.headerEditorOpen;

    const variableStyle = {
      height: variableOpen || headerOpen ? this.state.variableEditorHeight : null,
    };

    return (
      <div className="graphiql-container">
        <div className="historyPaneWrap" style={historyPaneStyle}>
          <QueryHistory
            operationName={this.state.operationName}
            query={this.state.query}
            variables={this.state.variables}
            onSelectQuery={this.handleSelectHistoryQuery}
            storage={this._storage}
            queryID={this._editorQueryID}>
            <div className="docExplorerHide" onClick={this.handleToggleHistory}>
              {'\u2715'}
            </div>
          </QueryHistory>
        </div>
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
              {toolbar}
            </div>
            {!this.state.docExplorerOpen && (
              <button
                className="docExplorerShow"
                onClick={this.handleToggleDocs}>
                {'Docs'}
              </button>
            )}
          </div>
          <div
            ref={n => {
              this.editorBarComponent = n;
            }}
            className="editorBar"
            onDoubleClick={this.handleResetResize}
            onMouseDown={this.handleResizeStart}>
            <div className="queryWrap" style={queryWrapStyle}>
              <QueryEditor
                ref={n => {
                  this.queryEditorComponent = n;
                }}
                schema={this.state.schema}
                value={this.state.query}
                onEdit={this.handleEditQuery}
                onHintInformationRender={this.handleHintInformationRender}
                onClickReference={this.handleClickReference}
                onCopyQuery={this.handleCopyQuery}
                onPrettifyQuery={this.handlePrettifyQuery}
                onMergeQuery={this.handleMergeQuery}
                onRunQuery={this.handleEditorRunQuery}
                editorTheme={this.props.editorTheme}
                readOnly={this.props.readOnly}
              />
              <div className="graphiql-editor-tools variable-editor-title"
                  style={{ cursor: variableOpen || headerOpen ? 'row-resize' : 'n-resize', paddingTop: '0px', paddingBottom: '0px' }}
                  onMouseDown={this.handleVariableResizeStart}>
                <button type="button" className="graphiql-un-styled" style={{ backgroundColor: variableOpen ? '#e1e1e1' : 'unset', fontSize: '18px', paddingBottom: '10px'}} onClick={this.onVariableTabClick} data-name="variables">Variables</button>
                <button type="button" className="graphiql-un-styled" style={{ backgroundColor: headerOpen && !variableOpen ? '#e1e1e1' : 'unset', fontSize: '18px', paddingBottom: '10px'}} onClick={this.onHeaderTabClick} data-name="variables">Headers</button>
              </div>
              <div className="variable-editor" style={variableStyle}>
                <div
                  className="variable-editor-title"
                  style={{ cursor: variableOpen || headerOpen ? 'row-resize' : 'n-resize', display: 'none' }}
                  onMouseDown={this.handleVariableResizeStart}>
                  {'Query Variables'}
                </div>
                {
                  (variableOpen || !headerOpen) && <VariableEditor
                    ref={n => {
                      this.variableEditorComponent = n;
                    }}
                    value={this.state.variables}
                    variableToType={this.state.variableToType}
                    onEdit={this.handleEditVariables}
                    onHintInformationRender={this.handleHintInformationRender}
                    onPrettifyQuery={this.handlePrettifyQuery}
                    onMergeQuery={this.handleMergeQuery}
                    onRunQuery={this.handleEditorRunQuery}
                    editorTheme={this.props.editorTheme}
                    readOnly={this.props.readOnly}
                  />
                } 
                {
                  headerOpen && !variableOpen && <VariableEditor
                    ref={n => {
                      this.variableEditorComponent = n;
                    }}
                    value={this.state.headers}
                    variableToType={this.state.variableToType}
                    onEdit={this.handleEditHeaders}
                    onHintInformationRender={this.handleHintInformationRender}
                    onPrettifyQuery={this.handlePrettifyQuery}
                    onMergeQuery={this.handleMergeQuery}
                    onRunQuery={this.handleEditorRunQuery}
                    editorTheme={this.props.editorTheme}
                    readOnly={this.props.readOnly}
                  />
                }
              </div>
            </div>
            <div className="resultWrap">
              {this.state.isWaitingForResponse && (
                <div className="spinner-container">
                  <div className="spinner" />
                </div>
              )}
              <ResultViewer
                ref={c => {
                  this.resultComponent = c;
                }}
                value={this.state.response}
                editorTheme={this.props.editorTheme}
                ResultsTooltip={this.props.ResultsTooltip}
                ImagePreview={ImagePreview}
              />
              {footer}
            </div>
          </div>
        </div>
        <div className={docExplorerWrapClasses} style={docWrapStyle}>
          <div
            className="docExplorerResizer"
            onDoubleClick={this.handleDocsResetResize}
            onMouseDown={this.handleDocsResizeStart}
          />
          <DocExplorer
            ref={c => {
              this.docExplorerComponent = c;
            }}
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
   * Get the query editor CodeMirror instance.
   *
   * @public
   */
  getQueryEditor() {
    return this.queryEditorComponent.getCodeMirror();
  }

  /**
   * Get the variable editor CodeMirror instance.
   *
   * @public
   */
  getVariableEditor() {
    return this.variableEditorComponent.getCodeMirror();
  }

  // /**
  //  * Get the variable editor CodeMirror instance.
  //  *
  //  * @public
  //  */
  // getHeaderEditor() {
  //   return this.headerEditorComponent.getCodeMirror();
  // }

  /**
   * Refresh all CodeMirror instances.
   *
   * @public
   */
  refresh() {
    this.queryEditorComponent.getCodeMirror().refresh();
    this.variableEditorComponent.getCodeMirror().refresh();
    // this.headerEditorComponent.getCodeMirror().refresh();
    this.resultComponent.getCodeMirror().refresh();
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
      this.props.getDefaultFieldNames,
    );
    if (insertions && insertions.length > 0) {
      const editor = this.getQueryEditor();
      editor.operation(() => {
        const cursor = editor.getCursor();
        const cursorIndex = editor.indexFromPos(cursor);
        editor.setValue(result);
        let added = 0;
        const markers = insertions.map(({ index, string }) =>
          editor.markText(
            editor.posFromIndex(index + added),
            editor.posFromIndex(index + (added += string.length)),
            {
              className: 'autoInsertedLeaf',
              clearOnEnter: true,
              title: 'Automatically added leaf fields',
            },
          ),
        );
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

  _fetchSchema() {
    const fetcher = this.props.fetcher;

    const fetch = observableToPromise(
      fetcher({
        query: introspectionQuery,
        operationName: introspectionQueryName,
      }),
    );
    if (!isPromise(fetch)) {
      this.setState({
        response: 'Fetcher did not return a Promise for introspection.',
      });
      return;
    }

    fetch
      .then(result => {
        if (result.data) {
          return result;
        }

        // Try the stock introspection query first, falling back on the
        // sans-subscriptions query for services which do not yet support it.
        const fetch2 = observableToPromise(
          fetcher({
            query: introspectionQuerySansSubscriptions,
            operationName: introspectionQueryName,
          }),
        );
        if (!isPromise(fetch)) {
          throw new Error(
            'Fetcher did not return a Promise for introspection.',
          );
        }
        return fetch2;
      })
      .then(result => {
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
          const responseString =
            typeof result === 'string'
              ? result
              : JSON.stringify(result, null, 2);
          this.setState({
            // Set schema to `null` to explicitly indicate that no schema exists.
            schema: null,
            response: responseString,
          });
        }
      })
      .catch(error => {
        this.setState({
          schema: null,
          response: error && String(error.stack || error),
        });
      });
  }

  _fetchQuery(query, variables, headers, operationName, cb) {
    const fetcher = this.props.fetcher;
    let jsonVariables = null;
    let headerVariables = null;

    try {
      jsonVariables =
        variables && variables.trim() !== '' ? JSON.parse(variables) : null;
    } catch (error) {
      throw new Error(`Variables are invalid JSON: ${error.message}.`);
    }

    try {
      headerVariables =
        headers && headers.trim() !== '' ? JSON.parse(headers) : null;
    } catch (error) {
      throw new Error(`Header Variables are invalid JSON: ${error.message}.`);
    }

    if (typeof jsonVariables !== 'object') {
      throw new Error('Variables are not a JSON object.');
    }

    if (typeof headerVariables !== 'object') {
      throw new Error('Header Variables are not a JSON object.');
    }

    const fetch = fetcher({
      headers: headerVariables,
      params: {
          query,
          variables: jsonVariables,
          operationName,
        }
      }
    );

    if (isPromise(fetch)) {
      // If fetcher returned a Promise, then call the callback when the promise
      // resolves, otherwise handle the error.
      fetch.then(cb).catch(error => {
        this.setState({
          isWaitingForResponse: false,
          response: error && String(error.stack || error),
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
            subscription: null,
          });
        },
        complete: () => {
          this.setState({
            isWaitingForResponse: false,
            subscription: null,
          });
        },
      });

      return subscription;
    } else {
      throw new Error('Fetcher did not return Promise or Observable.');
    }
  }

  handleClickReference = reference => {
    this.setState({ docExplorerOpen: true }, () => {
      this.docExplorerComponent.showDocForReference(reference);
    });
  };

  handleRunQuery = selectedOperationName => {
    this._editorQueryID++;
    const queryID = this._editorQueryID;

    // Use the edited query after autoCompleteLeafs() runs or,
    // in case autoCompletion fails (the function returns undefined),
    // the current query from the editor.
    const editedQuery = this.autoCompleteLeafs() || this.state.query;
    const variables = this.state.variables;
    const headers = this.state.headers;
    let operationName = this.state.operationName;

    // If an operation was explicitly provided, different from the current
    // operation name, then report that it changed.
    if (selectedOperationName && selectedOperationName !== operationName) {
      operationName = selectedOperationName;
      this.handleEditOperationName(operationName);
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
        headers,
        operationName,
        result => {
          if (queryID === this._editorQueryID) {
            this.setState({
              isWaitingForResponse: false,
              response: JSON.stringify(result, null, 2),
            });
          }
        },
      );

      this.setState({ subscription });
    } catch (error) {
      this.setState({
        isWaitingForResponse: false,
        response: error.message,
      });
    }
  };

  handleStopQuery = () => {
    const subscription = this.state.subscription;
    this.setState({
      isWaitingForResponse: false,
      subscription: null,
    });
    if (subscription) {
      subscription.unsubscribe();
    }
  };

  _runQueryAtCursor() {
    if (this.state.subscription) {
      this.handleStopQuery();
      return;
    }

    let operationName;
    const operations = this.state.operations;
    if (operations) {
      const editor = this.getQueryEditor();
      if (editor.hasFocus()) {
        const cursor = editor.getCursor();
        const cursorIndex = editor.indexFromPos(cursor);

        // Loop through all operations to see if one contains the cursor.
        for (let i = 0; i < operations.length; i++) {
          const operation = operations[i];
          if (
            operation.loc.start <= cursorIndex &&
            operation.loc.end >= cursorIndex
          ) {
            operationName = operation.name && operation.name.value;
            break;
          }
        }
      }
    }

    this.handleRunQuery(operationName);
  }

  handlePrettifyQuery = () => {
    const editor = this.getQueryEditor();
    editor.setValue(print(parse(editor.getValue())));
  };

  handleMergeQuery = () => {
    const editor = this.getQueryEditor();
    const query = editor.getValue();

    if (!query) {
      return;
    }

    const ast = parse(query);
    editor.setValue(print(mergeAst(ast)));
  };

  handleEditQuery = debounce(100, value => {
    const queryFacts = this._updateQueryFacts(
      value,
      this.state.operationName,
      this.state.operations,
      this.state.schema,
    );
    this.setState({
      query: value,
      ...queryFacts,
    });
    if (this.props.onEditQuery) {
      return this.props.onEditQuery(value);
    }
  });

  handleCopyQuery = () => {
    const editor = this.getQueryEditor();
    const query = editor.getValue();

    if (!query) {
      return;
    }

    copyToClipboard(query);

    if (this.props.onCopyQuery) {
      return this.props.onCopyQuery(query);
    }
  };

  _updateQueryFacts = (query, operationName, prevOperations, schema) => {
    const queryFacts = getQueryFacts(schema, query);
    if (queryFacts) {
      // Update operation name should any query names change.
      const updatedOperationName = getSelectedOperationName(
        prevOperations,
        operationName,
        queryFacts.operations,
      );

      // Report changing of operationName if it changed.
      const onEditOperationName = this.props.onEditOperationName;
      if (onEditOperationName && operationName !== updatedOperationName) {
        onEditOperationName(updatedOperationName);
      }

      return {
        operationName: updatedOperationName,
        ...queryFacts,
      };
    }
  };

  handleEditVariables = value => {
    this.setState({ variables: value });
    if (this.props.onEditVariables) {
      this.props.onEditVariables(value);
    }
  };

  handleEditHeaders = value => {
    this.setState({ headers: value });
    if (this.props.onEditHeaders) {
      this.props.onEditHeaders(value);
    }
  };

  handleEditOperationName = operationName => {
    const onEditOperationName = this.props.onEditOperationName;
    if (onEditOperationName) {
      onEditOperationName(operationName);
    }
  };

  handleHintInformationRender = elem => {
    elem.addEventListener('click', this._onClickHintInformation);

    let onRemoveFn;
    elem.addEventListener(
      'DOMNodeRemoved',
      (onRemoveFn = () => {
        elem.removeEventListener('DOMNodeRemoved', onRemoveFn);
        elem.removeEventListener('click', this._onClickHintInformation);
      }),
    );
  };

  handleEditorRunQuery = () => {
    this._runQueryAtCursor();
  };

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
  };

  handleToggleDocs = () => {
    if (typeof this.props.onToggleDocs === 'function') {
      this.props.onToggleDocs(!this.state.docExplorerOpen);
    }
    this.setState({ docExplorerOpen: !this.state.docExplorerOpen });
  };

  handleToggleHistory = () => {
    if (typeof this.props.onToggleHistory === 'function') {
      this.props.onToggleHistory(!this.state.historyPaneOpen);
    }
    this.setState({ historyPaneOpen: !this.state.historyPaneOpen });
  };

  handleSelectHistoryQuery = (query, variables, operationName) => {
    this.handleEditQuery(query);
    this.handleEditVariables(variables);
    this.handleEditOperationName(operationName);
  };

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
  };

  handleResetResize = () => {
    this.setState({ editorFlex: 1 });
  };

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
          docExplorerWidth: Math.min(docsSize, 650),
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
  };

  handleDocsResetResize = () => {
    this.setState({
      docExplorerWidth: DEFAULT_DOC_EXPLORER_WIDTH,
    });
  };

  onVariableTabClick = e => {
    e.preventDefault();
    this.setState({ variableEditorOpen: true });
    this.setState({ headerEditorOpen: false });
  }

  onHeaderTabClick = e => {
    e.preventDefault();
    this.setState({ variableEditorOpen: false });
    this.setState({ headerEditorOpen: true });
  }

  handleVariableResizeStart = downEvent => {
    downEvent.preventDefault();

    let didMove = false;
    const wasOpen = this.state.variableEditorOpen || this.state.headerEditorOpen;
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
          headerEditorOpen: false,
          variableEditorHeight: hadHeight,
        });
      } else {
        this.setState({
          variableEditorOpen: true,
          variableEditorHeight: bottomSize,
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
  };
}

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Logo = function GraphiQLLogo(props) {
  return (
    <div className="title">
      {props.children || (
        <span>
          {'Graph'}
          <em>{'i'}</em>
          {'QL'}
        </span>
      )}
    </div>
  );
};

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Toolbar = function GraphiQLToolbar(props) {
  return <div className="toolbar">{props.children}</div>;
};

// Export main windows/panes to be used separately if desired.
GraphiQL.QueryEditor = QueryEditor;
GraphiQL.VariableEditor = VariableEditor;
GraphiQL.ResultViewer = ResultViewer;

// Add a button to the Toolbar.
GraphiQL.Button = ToolbarButton;
GraphiQL.ToolbarButton = ToolbarButton; // Don't break existing API.

// Add a group of buttons to the Toolbar
GraphiQL.Group = ToolbarGroup;

// Add a menu of items to the Toolbar.
GraphiQL.Menu = ToolbarMenu;
GraphiQL.MenuItem = ToolbarMenuItem;

// Add a select-option input to the Toolbar.
GraphiQL.Select = ToolbarSelect;
GraphiQL.SelectOption = ToolbarSelectOption;

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Footer = function GraphiQLFooter(props) {
  return <div className="footer">{props.children}</div>;
};

const defaultQuery = `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that starts
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#     Merge Query:  Shift-Ctrl-M (or press the merge button above)
#
#       Run Query:  Ctrl-Enter (or press the play button above)
#
#   Auto Complete:  Ctrl-Space (or just start typing)
#

`;

// Duck-type promise detection.
function isPromise(value) {
  return typeof value === 'object' && typeof value.then === 'function';
}

// Duck-type Observable.take(1).toPromise()
function observableToPromise(observable) {
  if (!isObservable(observable)) {
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
      },
    );
  });
}

// Duck-type observable detection.
function isObservable(value) {
  return typeof value === 'object' && typeof value.subscribe === 'function';
}
