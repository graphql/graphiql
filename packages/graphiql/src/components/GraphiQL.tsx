/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, {
  ComponentType,
  PropsWithChildren,
  MouseEventHandler,
  Component,
  FunctionComponent,
} from 'react';
import {
  buildClientSchema,
  GraphQLSchema,
  parse,
  print,
  OperationDefinitionNode,
  IntrospectionQuery,
  GraphQLType,
} from 'graphql';
import copyToClipboard from 'copy-to-clipboard';

import { ExecuteButton } from './ExecuteButton';
import { ImagePreview } from './ImagePreview';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarMenu, ToolbarMenuItem } from './ToolbarMenu';
import { QueryEditor } from './QueryEditor';
import { VariableEditor } from './VariableEditor';
import { HeaderEditor } from './HeaderEditor';
import { ResultViewer } from './ResultViewer';
import { DocExplorer } from './DocExplorer';
import { QueryHistory } from './QueryHistory';
import CodeMirrorSizer from '../utility/CodeMirrorSizer';
import StorageAPI, { Storage } from '../utility/StorageAPI';
import getQueryFacts, { VariableToType } from '../utility/getQueryFacts';
import getSelectedOperationName from '../utility/getSelectedOperationName';
import debounce from '../utility/debounce';
import find from '../utility/find';
import { GetDefaultFieldNamesFn, fillLeafs } from '../utility/fillLeafs';
import { getLeft, getTop } from '../utility/elementPosition';
import mergeAST from '../utility/mergeAst';
import {
  introspectionQuery,
  introspectionQueryName,
  introspectionQuerySansSubscriptions,
} from '../utility/introspectionQueries';

const DEFAULT_DOC_EXPLORER_WIDTH = 350;

const majorVersion = parseInt(React.version.slice(0, 2), 10);

if (majorVersion < 16) {
  throw Error(
    [
      'GraphiQL 0.18.0 and after is not compatible with React 15 or below.',
      'If you are using a CDN source (jsdelivr, unpkg, etc), follow this example:',
      'https://github.com/graphql/graphiql/blob/master/examples/graphiql-cdn/index.html#L49',
    ].join('\n'),
  );
}

declare namespace global {
  export let g: GraphiQL;
}

export type Maybe<T> = T | null | undefined;

export type FetcherParams = {
  query: string;
  operationName: string;
  variables?: any;
};

export type FetcherOpts = {
  headers?: { [key: string]: any };
  shouldPersistHeaders: boolean;
};

export type FetcherResult =
  | {
      data: IntrospectionQuery;
    }
  | string
  | { data: any };

export type Fetcher = (
  graphQLParams: FetcherParams,
  opts?: FetcherOpts,
) => Promise<FetcherResult> | Observable<FetcherResult>;

type OnMouseMoveFn = Maybe<
  (moveEvent: MouseEvent | React.MouseEvent<Element>) => void
>;
type OnMouseUpFn = Maybe<() => void>;

export type GraphiQLProps = {
  fetcher: Fetcher;
  schema?: GraphQLSchema;
  query?: string;
  variables?: string;
  headers?: string;
  operationName?: string;
  response?: string;
  storage?: Storage;
  defaultQuery?: string;
  defaultVariableEditorOpen?: boolean;
  defaultSecondaryEditorOpen?: boolean;
  headerEditorEnabled?: boolean;
  shouldPersistHeaders?: boolean;
  onCopyQuery?: (query?: string) => void;
  onEditQuery?: (query?: string) => void;
  onEditVariables?: (value: string) => void;
  onEditHeaders?: (value: string) => void;
  onEditOperationName?: (operationName: string) => void;
  onToggleDocs?: (docExplorerOpen: boolean) => void;
  getDefaultFieldNames?: GetDefaultFieldNamesFn;
  editorTheme?: string;
  onToggleHistory?: (historyPaneOpen: boolean) => void;
  ResultsTooltip?: typeof Component | FunctionComponent;
  readOnly?: boolean;
  docExplorerOpen?: boolean;
};

export type GraphiQLState = {
  schema?: GraphQLSchema;
  query?: string;
  variables?: string;
  headers?: string;
  operationName?: string;
  docExplorerOpen: boolean;
  response?: string;
  editorFlex: number;
  secondaryEditorOpen: boolean;
  secondaryEditorHeight: number;
  variableEditorActive: boolean;
  headerEditorActive: boolean;
  headerEditorEnabled: boolean;
  shouldPersistHeaders: boolean;
  historyPaneOpen: boolean;
  docExplorerWidth: number;
  isWaitingForResponse: boolean;
  subscription?: Unsubscribable | null;
  variableToType?: VariableToType;
  operations?: OperationDefinitionNode[];
};

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */
export class GraphiQL extends React.Component<GraphiQLProps, GraphiQLState> {
  /**
   * Static Methods
   */
  static formatResult(result: any) {
    return JSON.stringify(result, null, 2);
  }

  static formatError(rawError: Error) {
    const result = Array.isArray(rawError)
      ? rawError.map(formatSingleError)
      : formatSingleError(rawError);
    return JSON.stringify(result, null, 2);
  }

  // Ensure only the last executed editor query is rendered.
  _editorQueryID = 0;
  _storage: StorageAPI;

  codeMirrorSizer!: CodeMirrorSizer;
  // Ensure the component is mounted to execute async setState
  componentIsMounted: boolean;

  // refs
  docExplorerComponent: Maybe<DocExplorer>;
  graphiqlContainer: Maybe<HTMLDivElement>;
  resultComponent: Maybe<ResultViewer>;
  variableEditorComponent: Maybe<VariableEditor>;
  headerEditorComponent: Maybe<HeaderEditor>;
  _queryHistory: Maybe<QueryHistory>;
  editorBarComponent: Maybe<HTMLDivElement>;
  queryEditorComponent: Maybe<QueryEditor>;
  resultViewerElement: Maybe<HTMLElement>;

  constructor(props: GraphiQLProps) {
    super(props);

    // Ensure props are correct
    if (typeof props.fetcher !== 'function') {
      throw new TypeError('GraphiQL requires a fetcher function.');
    }

    // Cache the storage instance
    this._storage = new StorageAPI(props.storage);

    // Disable setState when the component is not mounted
    this.componentIsMounted = false;

    // Determine the initial query to display.
    const query =
      props.query !== undefined
        ? props.query
        : this._storage.get('query')
        ? (this._storage.get('query') as string)
        : props.defaultQuery !== undefined
        ? props.defaultQuery
        : defaultQuery;

    // Get the initial query facts.
    const queryFacts = getQueryFacts(props.schema, query);

    // Determine the initial variables to display.
    const variables =
      props.variables !== undefined
        ? props.variables
        : this._storage.get('variables');

    // Determine the initial headers to display.
    const headers =
      props.headers !== undefined
        ? props.headers
        : this._storage.get('headers');

    // Determine the initial operationName to use.
    const operationName =
      props.operationName !== undefined
        ? props.operationName
        : getSelectedOperationName(
            undefined,
            this._storage.get('operationName') as string,
            queryFacts && queryFacts.operations,
          );

    // prop can be supplied to open docExplorer initially
    let docExplorerOpen = props.docExplorerOpen || false;

    // but then local storage state overrides it
    if (this._storage.get('docExplorerOpen')) {
      docExplorerOpen = this._storage.get('docExplorerOpen') === 'true';
    }

    // initial secondary editor pane open
    let secondaryEditorOpen;
    if (props.defaultVariableEditorOpen !== undefined) {
      secondaryEditorOpen = props.defaultVariableEditorOpen;
    } else if (props.defaultSecondaryEditorOpen !== undefined) {
      secondaryEditorOpen = props.defaultSecondaryEditorOpen;
    } else {
      secondaryEditorOpen = Boolean(variables || headers);
    }

    const headerEditorEnabled = props.headerEditorEnabled ?? false;
    const shouldPersistHeaders = props.shouldPersistHeaders ?? false;

    // Initialize state
    this.state = {
      schema: props.schema,
      query,
      variables: variables as string,
      headers: headers as string,
      operationName,
      docExplorerOpen,
      response: props.response,
      editorFlex: Number(this._storage.get('editorFlex')) || 1,
      secondaryEditorOpen,
      secondaryEditorHeight:
        Number(this._storage.get('secondaryEditorHeight')) || 200,
      variableEditorActive:
        this._storage.get('variableEditorActive') === 'true' ||
        props.headerEditorEnabled
          ? this._storage.get('headerEditorActive') !== 'true'
          : secondaryEditorOpen && true,
      headerEditorActive: this._storage.get('headerEditorActive') === 'true',
      headerEditorEnabled,
      shouldPersistHeaders,
      historyPaneOpen: this._storage.get('historyPaneOpen') === 'true' || false,
      docExplorerWidth:
        Number(this._storage.get('docExplorerWidth')) ||
        DEFAULT_DOC_EXPLORER_WIDTH,
      isWaitingForResponse: false,
      subscription: null,
      ...queryFacts,
    };
  }

  componentDidMount() {
    // Allow async state changes
    this.componentIsMounted = true;

    // Only fetch schema via introspection if a schema has not been
    // provided, including if `null` was provided.
    if (this.state.schema === undefined) {
      this.fetchSchema();
    }

    // Utility for keeping CodeMirror correctly sized.
    this.codeMirrorSizer = new CodeMirrorSizer();

    global.g = this;
  }
  UNSAFE_componentWillMount() {
    this.componentIsMounted = false;
  }
  // TODO: these values should be updated in a reducer imo
  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: GraphiQLProps) {
    let nextSchema = this.state.schema;
    let nextQuery = this.state.query;
    let nextVariables = this.state.variables;
    let nextHeaders = this.state.headers;
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
    if (nextProps.headers !== undefined) {
      nextHeaders = nextProps.headers;
    }
    if (nextProps.operationName !== undefined) {
      nextOperationName = nextProps.operationName;
    }
    if (nextProps.response !== undefined) {
      nextResponse = nextProps.response;
    }
    if (
      nextQuery &&
      nextSchema &&
      (nextSchema !== this.state.schema ||
        nextQuery !== this.state.query ||
        nextOperationName !== this.state.operationName)
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
    this._storage.set('operationName', nextOperationName as string);
    this.setState(
      {
        schema: nextSchema,
        query: nextQuery,
        variables: nextVariables,
        headers: nextHeaders,
        operationName: nextOperationName,
        response: nextResponse,
      },
      () => {
        if (this.state.schema === undefined) {
          if (this.docExplorerComponent) {
            this.docExplorerComponent.reset();
          }

          this.fetchSchema();
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
      this.headerEditorComponent,
      this.resultComponent,
    ]);
  }

  // Use it when the state change is async
  // TODO: Annotate correctly this function
  safeSetState = (nextState: any, callback?: any): void => {
    this.componentIsMounted && this.setState(nextState, callback);
  };

  render() {
    const children = React.Children.toArray(this.props.children);

    const logo = find(children, child =>
      isChildComponentType(child, GraphiQL.Logo),
    ) || <GraphiQL.Logo />;

    const toolbar = find(children, child =>
      isChildComponentType(child, GraphiQL.Toolbar),
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

    const footer = find(children, child =>
      isChildComponentType(child, GraphiQL.Footer),
    );

    const queryWrapStyle = {
      WebkitFlex: this.state.editorFlex,
      flex: this.state.editorFlex,
    };

    const docWrapStyle = {
      display: 'block',
      width: this.state.docExplorerWidth,
    };
    const docExplorerWrapClasses =
      'docExplorerWrap' +
      (this.state.docExplorerWidth < 200 ? ' doc-explorer-narrow' : '');

    const historyPaneStyle = {
      display: this.state.historyPaneOpen ? 'block' : 'none',
      width: '230px',
      zIndex: 7,
    };

    const secondaryEditorOpen = this.state.secondaryEditorOpen;
    const secondaryEditorStyle = {
      height: secondaryEditorOpen
        ? this.state.secondaryEditorHeight
        : undefined,
    };

    return (
      <div
        ref={n => {
          this.graphiqlContainer = n;
        }}
        className="graphiql-container">
        <div className="historyPaneWrap" style={historyPaneStyle}>
          <QueryHistory
            ref={node => {
              this._queryHistory = node;
            }}
            operationName={this.state.operationName}
            query={this.state.query}
            variables={this.state.variables}
            onSelectQuery={this.handleSelectHistoryQuery}
            storage={this._storage}
            queryID={this._editorQueryID}>
            <button
              className="docExplorerHide"
              onClick={this.handleToggleHistory}
              aria-label="Close History">
              {'\u2715'}
            </button>
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
                onClick={this.handleToggleDocs}
                aria-label="Open Documentation Explorer">
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
              <section
                className="variable-editor secondary-editor"
                style={secondaryEditorStyle}
                aria-label={
                  this.state.variableEditorActive
                    ? 'Query Variables'
                    : 'Request Headers'
                }>
                <div
                  className="secondary-editor-title variable-editor-title"
                  id="secondary-editor-title"
                  style={{
                    cursor: secondaryEditorOpen ? 'row-resize' : 'n-resize',
                  }}
                  onMouseDown={this.handleSecondaryEditorResizeStart}>
                  <div
                    style={{
                      cursor: 'pointer',
                      color: this.state.variableEditorActive ? '#000' : 'gray',
                      display: 'inline-block',
                    }}
                    onClick={this.handleOpenVariableEditorTab}
                    onMouseDown={this.handleTabClickPropogation}>
                    {'Query Variables'}
                  </div>
                  {this.state.headerEditorEnabled && (
                    <div
                      style={{
                        cursor: 'pointer',
                        color: this.state.headerEditorActive ? '#000' : 'gray',
                        display: 'inline-block',
                        marginLeft: '20px',
                      }}
                      onClick={this.handleOpenHeaderEditorTab}
                      onMouseDown={this.handleTabClickPropogation}>
                      {'Request Headers'}
                    </div>
                  )}
                </div>
                <VariableEditor
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
                  active={this.state.variableEditorActive}
                />
                {this.state.headerEditorEnabled && (
                  <HeaderEditor
                    ref={n => {
                      this.headerEditorComponent = n;
                    }}
                    value={this.state.headers}
                    onEdit={this.handleEditHeaders}
                    onHintInformationRender={this.handleHintInformationRender}
                    onPrettifyQuery={this.handlePrettifyQuery}
                    onMergeQuery={this.handleMergeQuery}
                    onRunQuery={this.handleEditorRunQuery}
                    editorTheme={this.props.editorTheme}
                    readOnly={this.props.readOnly}
                    active={this.state.headerEditorActive}
                  />
                )}
              </section>
            </div>
            <div className="resultWrap">
              {this.state.isWaitingForResponse && (
                <div className="spinner-container">
                  <div className="spinner" />
                </div>
              )}
              <ResultViewer
                registerRef={n => {
                  this.resultViewerElement = n;
                }}
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
        {this.state.docExplorerOpen && (
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
              <button
                className="docExplorerHide"
                onClick={this.handleToggleDocs}
                aria-label="Close Documentation Explorer">
                {'\u2715'}
              </button>
            </DocExplorer>
          </div>
        )}
      </div>
    );
  }

  // Export main windows/panes to be used separately if desired.
  static Logo = GraphiQLLogo;
  static Toolbar = GraphiQLToolbar;
  static Footer = GraphiQLFooter;
  static QueryEditor = QueryEditor;
  static VariableEditor = VariableEditor;
  static HeaderEditor = HeaderEditor;
  static ResultViewer = ResultViewer;

  // Add a button to the Toolbar.
  static Button = ToolbarButton;
  static ToolbarButton = ToolbarButton; // Don't break existing API.

  // Add a group of buttons to the Toolbar
  static Group = ToolbarGroup;

  // Add a menu of items to the Toolbar.
  static Menu = ToolbarMenu;
  static MenuItem = ToolbarMenuItem;

  // Add a select-option input to the Toolbar.
  // static Select = ToolbarSelect;
  // static SelectOption = ToolbarSelectOption;

  /**
   * Get the query editor CodeMirror instance.
   *
   * @public
   */
  getQueryEditor() {
    if (this.queryEditorComponent) {
      return this.queryEditorComponent.getCodeMirror();
    }
    // return null
  }

  /**
   * Get the variable editor CodeMirror instance.
   *
   * @public
   */
  public getVariableEditor() {
    if (this.variableEditorComponent) {
      return this.variableEditorComponent.getCodeMirror();
    }
    return null;
  }

  /**
   * Get the header editor CodeMirror instance.
   *
   * @public
   */
  public getHeaderEditor() {
    if (this.headerEditorComponent) {
      return this.headerEditorComponent.getCodeMirror();
    }
    return null;
  }

  /**
   * Refresh all CodeMirror instances.
   *
   * @public
   */
  public refresh() {
    if (this.queryEditorComponent) {
      this.queryEditorComponent.getCodeMirror().refresh();
    }
    if (this.variableEditorComponent) {
      this.variableEditorComponent.getCodeMirror().refresh();
    }
    if (this.headerEditorComponent) {
      this.headerEditorComponent.getCodeMirror().refresh();
    }
    if (this.resultComponent) {
      this.resultComponent.getCodeMirror().refresh();
    }
  }

  /**
   * Inspect the query, automatically filling in selection sets for non-leaf
   * fields which do not yet have them.
   *
   * @public
   */
  public autoCompleteLeafs() {
    const { insertions, result } = fillLeafs(
      this.state.schema,
      this.state.query,
      this.props.getDefaultFieldNames,
    );
    if (insertions && insertions.length > 0) {
      const editor = this.getQueryEditor();
      if (editor) {
        editor.operation(() => {
          const cursor = editor.getCursor();
          const cursorIndex = editor.indexFromPos(cursor);
          editor.setValue(result || '');
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
    }

    return result;
  }

  // Private methods

  private fetchSchema() {
    const fetcher = this.props.fetcher;

    const fetcherOpts: FetcherOpts = {
      shouldPersistHeaders: Boolean(this.props.shouldPersistHeaders),
    };
    if (this.state.headers && this.state.headers.trim().length > 2) {
      fetcherOpts.headers = JSON.parse(this.state.headers);
      // if state is not present, but props are
    } else if (this.props.headers) {
      fetcherOpts.headers = JSON.parse(this.props.headers);
    }

    const fetch = observableToPromise(
      fetcher(
        {
          query: introspectionQuery,
          operationName: introspectionQueryName,
        },
        fetcherOpts,
      ),
    );
    if (!isPromise(fetch)) {
      this.setState({
        response: 'Fetcher did not return a Promise for introspection.',
      });
      return;
    }

    fetch
      .then(result => {
        if (typeof result !== 'string' && 'data' in result) {
          return result;
        }

        // Try the stock introspection query first, falling back on the
        // sans-subscriptions query for services which do not yet support it.
        const fetch2 = observableToPromise(
          fetcher(
            {
              query: introspectionQuerySansSubscriptions,
              operationName: introspectionQueryName,
            },
            fetcherOpts,
          ),
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

        if (typeof result !== 'string' && 'data' in result) {
          const schema = buildClientSchema(result.data);
          const queryFacts = getQueryFacts(schema, this.state.query);
          this.safeSetState({ schema, ...queryFacts });
        } else {
          const responseString =
            typeof result === 'string' ? result : GraphiQL.formatResult(result);
          this.safeSetState({
            // Set schema to `null` to explicitly indicate that no schema exists.
            schema: undefined,
            response: responseString,
          });
        }
      })
      .catch(error => {
        this.safeSetState({
          schema: undefined,
          response: error ? GraphiQL.formatError(error) : undefined,
        });
      });
  }

  private _fetchQuery(
    query: string,
    variables: string,
    headers: string,
    operationName: string,
    shouldPersistHeaders: boolean,
    cb: (value: FetcherResult) => any,
  ) {
    const fetcher = this.props.fetcher;
    let jsonVariables = null;
    let jsonHeaders = null;

    try {
      jsonVariables =
        variables && variables.trim() !== '' ? JSON.parse(variables) : null;
    } catch (error) {
      throw new Error(`Variables are invalid JSON: ${error.message}.`);
    }

    if (typeof jsonVariables !== 'object') {
      throw new Error('Variables are not a JSON object.');
    }

    try {
      jsonHeaders =
        headers && headers.trim() !== '' ? JSON.parse(headers) : null;
    } catch (error) {
      throw new Error(`Headers are invalid JSON: ${error.message}.`);
    }

    if (typeof jsonHeaders !== 'object') {
      throw new Error('Headers are not a JSON object.');
    }

    const fetch = fetcher(
      {
        query,
        variables: jsonVariables,
        operationName,
      },
      { headers: jsonHeaders, shouldPersistHeaders },
    );

    if (isPromise(fetch)) {
      // If fetcher returned a Promise, then call the callback when the promise
      // resolves, otherwise handle the error.
      fetch.then(cb).catch(error => {
        this.safeSetState({
          isWaitingForResponse: false,
          response: error ? GraphiQL.formatError(error) : undefined,
        });
      });
    } else if (isObservable(fetch)) {
      // If the fetcher returned an Observable, then subscribe to it, calling
      // the callback on each next value, and handling both errors and the
      // completion of the Observable. Returns a Subscription object.
      const subscription = fetch.subscribe({
        next: cb,
        error: (error: Error) => {
          this.safeSetState({
            isWaitingForResponse: false,
            response: error ? GraphiQL.formatError(error) : undefined,
            subscription: null,
          });
        },
        complete: () => {
          this.safeSetState({
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

  handleClickReference = (reference: GraphQLType) => {
    this.setState({ docExplorerOpen: true }, () => {
      if (this.docExplorerComponent) {
        this.docExplorerComponent.showDocForReference(reference);
      }
    });
    this._storage.set(
      'docExplorerOpen',
      JSON.stringify(this.state.docExplorerOpen),
    );
  };

  handleRunQuery = (selectedOperationName?: string) => {
    this._editorQueryID++;
    const queryID = this._editorQueryID;

    // Use the edited query after autoCompleteLeafs() runs or,
    // in case autoCompletion fails (the function returns undefined),
    // the current query from the editor.
    const editedQuery = this.autoCompleteLeafs() || this.state.query;
    const variables = this.state.variables;
    const headers = this.state.headers;
    const shouldPersistHeaders = this.state.shouldPersistHeaders;
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
        response: undefined,
        operationName,
      });
      this._storage.set('operationName', operationName as string);

      if (this._queryHistory) {
        this._queryHistory.updateHistory(
          editedQuery,
          variables,
          headers,
          operationName,
        );
      }

      // _fetchQuery may return a subscription.
      const subscription = this._fetchQuery(
        editedQuery as string,
        variables as string,
        headers as string,
        operationName as string,
        shouldPersistHeaders as boolean,
        (result: FetcherResult) => {
          if (queryID === this._editorQueryID) {
            this.setState({
              isWaitingForResponse: false,
              response: GraphiQL.formatResult(result),
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

  private _runQueryAtCursor() {
    if (this.state.subscription) {
      this.handleStopQuery();
      return;
    }

    let operationName;
    const operations = this.state.operations;
    if (operations) {
      const editor = this.getQueryEditor();
      if (editor && editor.hasFocus()) {
        const cursor = editor.getCursor();
        const cursorIndex = editor.indexFromPos(cursor);

        // Loop through all operations to see if one contains the cursor.
        for (let i = 0; i < operations.length; i++) {
          const operation = operations[i];
          if (
            operation.loc &&
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
    const editorContent = editor?.getValue() ?? '';
    const prettifiedEditorContent = print(parse(editorContent));

    if (prettifiedEditorContent !== editorContent) {
      editor?.setValue(prettifiedEditorContent);
    }

    const variableEditor = this.getVariableEditor();
    const variableEditorContent = variableEditor?.getValue() ?? '';

    try {
      const prettifiedVariableEditorContent = JSON.stringify(
        JSON.parse(variableEditorContent),
        null,
        2,
      );
      if (prettifiedVariableEditorContent !== variableEditorContent) {
        variableEditor?.setValue(prettifiedVariableEditorContent);
      }
    } catch {
      /* Parsing JSON failed, skip prettification */
    }

    const headerEditor = this.getHeaderEditor();
    const headerEditorContent = headerEditor?.getValue() ?? '';

    try {
      const prettifiedHeaderEditorContent = JSON.stringify(
        JSON.parse(headerEditorContent),
        null,
        2,
      );
      if (prettifiedHeaderEditorContent !== headerEditorContent) {
        headerEditor?.setValue(prettifiedHeaderEditorContent);
      }
    } catch {
      /* Parsing JSON failed, skip prettification */
    }
  };

  handleMergeQuery = () => {
    const editor = this.getQueryEditor() as CodeMirror.Editor;
    const query = editor.getValue();

    if (!query) {
      return;
    }

    const ast = parse(query);
    editor.setValue(print(mergeAST(ast)));
  };

  handleEditQuery = debounce(100, (value: string) => {
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
    this._storage.set('query', value);
    if (this.props.onEditQuery) {
      return this.props.onEditQuery(value);
    }
  });

  handleCopyQuery = () => {
    const editor = this.getQueryEditor();
    const query = editor && editor.getValue();

    if (!query) {
      return;
    }

    copyToClipboard(query);

    if (this.props.onCopyQuery) {
      return this.props.onCopyQuery(query);
    }
  };

  private _updateQueryFacts = (
    query: string,
    operationName?: string,
    prevOperations?: OperationDefinitionNode[],
    schema?: GraphQLSchema,
  ) => {
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
      if (
        onEditOperationName &&
        updatedOperationName &&
        operationName !== updatedOperationName
      ) {
        onEditOperationName(updatedOperationName);
      }

      return {
        operationName: updatedOperationName,
        ...queryFacts,
      };
    }
  };

  handleEditVariables = (value: string) => {
    this.setState({ variables: value });
    debounce(500, () => this._storage.set('variables', value))();
    if (this.props.onEditVariables) {
      this.props.onEditVariables(value);
    }
  };

  handleEditHeaders = (value: string) => {
    this.setState({ headers: value });
    this.props.shouldPersistHeaders &&
      debounce(500, () => this._storage.set('headers', value))();
    if (this.props.onEditHeaders) {
      this.props.onEditHeaders(value);
    }
  };

  handleEditOperationName = (operationName: string) => {
    const onEditOperationName = this.props.onEditOperationName;
    if (onEditOperationName) {
      onEditOperationName(operationName);
    }
  };

  handleHintInformationRender = (elem: HTMLDivElement) => {
    elem.addEventListener('click', this._onClickHintInformation);

    let onRemoveFn: EventListener;
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

  private _onClickHintInformation = (
    event: MouseEvent | React.MouseEvent<HTMLDivElement>,
  ) => {
    if (
      event?.currentTarget &&
      'className' in event.currentTarget &&
      event.currentTarget.className === 'typeName'
    ) {
      const typeName = event.currentTarget.innerHTML;
      const schema = this.state.schema;
      if (schema) {
        const type = schema.getType(typeName);
        if (type) {
          this.setState({ docExplorerOpen: true }, () => {
            if (this.docExplorerComponent) {
              this.docExplorerComponent.showDoc(type);
            }
          });
          debounce(500, () =>
            this._storage.set(
              'docExplorerOpen',
              JSON.stringify(this.state.docExplorerOpen),
            ),
          )();
        }
      }
    }
  };

  handleToggleDocs = () => {
    if (typeof this.props.onToggleDocs === 'function') {
      this.props.onToggleDocs(!this.state.docExplorerOpen);
    }
    this._storage.set(
      'docExplorerOpen',
      JSON.stringify(!this.state.docExplorerOpen),
    );
    this.setState({ docExplorerOpen: !this.state.docExplorerOpen });
  };

  handleToggleHistory = () => {
    if (typeof this.props.onToggleHistory === 'function') {
      this.props.onToggleHistory(!this.state.historyPaneOpen);
    }
    this._storage.set(
      'historyPaneOpen',
      JSON.stringify(!this.state.historyPaneOpen),
    );
    this.setState({ historyPaneOpen: !this.state.historyPaneOpen });
  };

  handleSelectHistoryQuery = (
    query?: string,
    variables?: string,
    headers?: string,
    operationName?: string,
  ) => {
    if (query) {
      this.handleEditQuery(query);
    }
    if (variables) {
      this.handleEditVariables(variables);
    }
    if (headers) {
      this.handleEditHeaders(headers);
    }
    if (operationName) {
      this.handleEditOperationName(operationName);
    }
  };

  private handleResizeStart = (downEvent: React.MouseEvent) => {
    if (!this._didClickDragBar(downEvent)) {
      return;
    }

    downEvent.preventDefault();

    const offset = downEvent.clientX - getLeft(downEvent.target as HTMLElement);

    let onMouseMove: OnMouseMoveFn = moveEvent => {
      if (moveEvent.buttons === 0) {
        return onMouseUp!();
      }

      const editorBar = this.editorBarComponent as HTMLElement;
      const leftSize = moveEvent.clientX - getLeft(editorBar) - offset;
      const rightSize = editorBar.clientWidth - leftSize;
      this.setState({ editorFlex: leftSize / rightSize });
      debounce(500, () =>
        this._storage.set('editorFlex', JSON.stringify(this.state.editorFlex)),
      )();
    };

    let onMouseUp: OnMouseUpFn = () => {
      document.removeEventListener('mousemove', onMouseMove!);
      document.removeEventListener('mouseup', onMouseUp!);
      onMouseMove = null;
      onMouseUp = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  handleResetResize = () => {
    this.setState({ editorFlex: 1 });
    this._storage.set('editorFlex', JSON.stringify(this.state.editorFlex));
  };

  private _didClickDragBar(event: React.MouseEvent) {
    // Only for primary unmodified clicks
    if (event.button !== 0 || event.ctrlKey) {
      return false;
    }
    let target = event.target as Element;
    // We use codemirror's gutter as the drag bar.
    if (target.className.indexOf('CodeMirror-gutter') !== 0) {
      return false;
    }
    // Specifically the result window's drag bar.
    const resultWindow = this.resultViewerElement;
    while (target) {
      if (target === resultWindow) {
        return true;
      }
      target = target.parentNode as Element;
    }
    return false;
  }

  private handleDocsResizeStart: MouseEventHandler<
    HTMLDivElement
  > = downEvent => {
    downEvent.preventDefault();

    const hadWidth = this.state.docExplorerWidth;
    const offset = downEvent.clientX - getLeft(downEvent.target as HTMLElement);

    let onMouseMove: OnMouseMoveFn = moveEvent => {
      if (moveEvent.buttons === 0) {
        return onMouseUp!();
      }

      const app = this.graphiqlContainer as HTMLElement;
      const cursorPos = moveEvent.clientX - getLeft(app) - offset;
      const docsSize = app.clientWidth - cursorPos;

      if (docsSize < 100) {
        this.setState({ docExplorerOpen: false });
      } else {
        this.setState({
          docExplorerOpen: true,
          docExplorerWidth: Math.min(docsSize, 650),
        });
        debounce(500, () =>
          this._storage.set(
            'docExplorerWidth',
            JSON.stringify(this.state.docExplorerWidth),
          ),
        )();
      }
      this._storage.set(
        'docExplorerOpen',
        JSON.stringify(this.state.docExplorerOpen),
      );
    };

    let onMouseUp: OnMouseUpFn = () => {
      if (!this.state.docExplorerOpen) {
        this.setState({ docExplorerWidth: hadWidth });
        debounce(500, () =>
          this._storage.set(
            'docExplorerWidth',
            JSON.stringify(this.state.docExplorerWidth),
          ),
        )();
      }

      document.removeEventListener('mousemove', onMouseMove!);
      document.removeEventListener('mouseup', onMouseUp!);
      onMouseMove = null;
      onMouseUp = null;
    };

    document.addEventListener('mousemove', onMouseMove!);
    document.addEventListener('mouseup', onMouseUp);
  };

  private handleDocsResetResize = () => {
    this.setState({
      docExplorerWidth: DEFAULT_DOC_EXPLORER_WIDTH,
    });
    debounce(500, () =>
      this._storage.set(
        'docExplorerWidth',
        JSON.stringify(this.state.docExplorerWidth),
      ),
    )();
  };

  // Prevent clicking on the tab button from propagating to the resizer.
  private handleTabClickPropogation: MouseEventHandler<
    HTMLDivElement
  > = downEvent => {
    downEvent.preventDefault();
    downEvent.stopPropagation();
  };

  private handleOpenHeaderEditorTab: MouseEventHandler<
    HTMLDivElement
  > = _clickEvent => {
    this.setState({
      headerEditorActive: true,
      variableEditorActive: false,
      secondaryEditorOpen: true,
    });
  };

  private handleOpenVariableEditorTab: MouseEventHandler<
    HTMLDivElement
  > = _clickEvent => {
    this.setState({
      headerEditorActive: false,
      variableEditorActive: true,
      secondaryEditorOpen: true,
    });
  };

  private handleSecondaryEditorResizeStart: MouseEventHandler<
    HTMLDivElement
  > = downEvent => {
    downEvent.preventDefault();

    let didMove = false;
    const wasOpen = this.state.secondaryEditorOpen;
    const hadHeight = this.state.secondaryEditorHeight;
    const offset = downEvent.clientY - getTop(downEvent.target as HTMLElement);

    let onMouseMove: OnMouseMoveFn = moveEvent => {
      if (moveEvent.buttons === 0) {
        return onMouseUp!();
      }

      didMove = true;

      const editorBar = this.editorBarComponent as HTMLElement;
      const topSize = moveEvent.clientY - getTop(editorBar) - offset;
      const bottomSize = editorBar.clientHeight - topSize;
      if (bottomSize < 60) {
        this.setState({
          secondaryEditorOpen: false,
          secondaryEditorHeight: hadHeight,
        });
      } else {
        this.setState({
          secondaryEditorOpen: true,
          secondaryEditorHeight: bottomSize,
        });
      }
      debounce(500, () =>
        this._storage.set(
          'secondaryEditorHeight',
          JSON.stringify(this.state.secondaryEditorHeight),
        ),
      )();
    };

    let onMouseUp: OnMouseUpFn = () => {
      if (!didMove) {
        this.setState({ secondaryEditorOpen: !wasOpen });
      }

      document.removeEventListener('mousemove', onMouseMove!);
      document.removeEventListener('mouseup', onMouseUp!);
      onMouseMove = null;
      onMouseUp = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
}

// // Configure the UI by providing this Component as a child of GraphiQL.
function GraphiQLLogo<TProps>(props: PropsWithChildren<TProps>) {
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
}
GraphiQLLogo.displayName = 'GraphiQLLogo';

// Configure the UI by providing this Component as a child of GraphiQL.
function GraphiQLToolbar<TProps>(props: PropsWithChildren<TProps>) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Editor Commands">
      {props.children}
    </div>
  );
}
GraphiQLToolbar.displayName = 'GraphiQLToolbar';

// Configure the UI by providing this Component as a child of GraphiQL.
function GraphiQLFooter<TProps>(props: PropsWithChildren<TProps>) {
  return <div className="footer">{props.children}</div>;
}
GraphiQLFooter.displayName = 'GraphiQLFooter';

const formatSingleError = (error: Error) => ({
  ...error,
  // Raise these details even if they're non-enumerable
  message: error.message,
  stack: error.stack,
});

const defaultQuery = `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
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
function isPromise<T>(value: Promise<T> | any): value is Promise<T> {
  return typeof value === 'object' && typeof value.then === 'function';
}

// These type just taken from https://github.com/ReactiveX/rxjs/blob/master/src/internal/types.ts#L41
type Unsubscribable = {
  unsubscribe: () => void;
};

type Observable<T> = {
  subscribe(opts: {
    next: (value: T) => void;
    error: (error: any) => void;
    complete: () => void;
  }): Unsubscribable;
  subscribe(
    next: (value: T) => void,
    error: null | undefined,
    complete: () => void,
  ): Unsubscribable;
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): Unsubscribable;
};

// Duck-type Observable.take(1).toPromise()
function observableToPromise<T>(
  observable: Observable<T> | Promise<T>,
): Promise<T> {
  if (!isObservable<T>(observable)) {
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
function isObservable<T>(value: any): value is Observable<T> {
  return (
    typeof value === 'object' &&
    'subscribe' in value &&
    typeof value.subscribe === 'function'
  );
}

// Determines if the React child is of the same type of the provided React component
function isChildComponentType<T extends ComponentType>(
  child: any,
  component: T,
): child is T {
  if (
    child?.type?.displayName &&
    child.type.displayName === component.displayName
  ) {
    return true;
  }

  return child.type === component;
}
