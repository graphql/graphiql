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
  ReactNode,
} from 'react';
import {
  GraphQLSchema,
  parse,
  print,
  visit,
  ValidationRule,
  FragmentDefinitionNode,
  DocumentNode,
} from 'graphql';
import { getFragmentDependenciesForAST } from 'graphql-language-service';

import {
  EditorContextProvider,
  ExplorerContextProvider,
  HistoryContextProvider,
  SchemaContextProvider,
  StorageContextProvider,
  useAutoCompleteLeafs,
  useCopyQuery,
  useEditorContext,
  useExplorerContext,
  useHistoryContext,
  useMergeQuery,
  usePrettifyEditors,
  useSchemaContext,
  useStorageContext,
} from '@graphiql/react';
import type {
  EditorContextType,
  ExplorerContextType,
  HistoryContextType,
  ResponseTooltipType,
  SchemaContextType,
  StorageContextType,
  TabsState,
} from '@graphiql/react';

import { ExecuteButton } from './ExecuteButton';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarMenu, ToolbarMenuItem } from './ToolbarMenu';
import { QueryEditor } from './QueryEditor';
import { VariableEditor } from './VariableEditor';
import { HeaderEditor } from './HeaderEditor';
import { ResultViewer, RESULT_VIEWER_ID } from './ResultViewer';
import { DocExplorer } from './DocExplorer';
import { QueryHistory } from './QueryHistory';
import debounce from '../utility/debounce';
import find from '../utility/find';
import { getLeft, getTop } from '../utility/elementPosition';
import setValue from 'set-value';

import {
  formatError,
  formatResult,
  isAsyncIterable,
  isObservable,
} from '@graphiql/toolkit';
import type {
  Fetcher,
  FetcherResult,
  FetcherResultPayload,
  GetDefaultFieldNamesFn,
  QueryStoreItem,
  SyncFetcherResult,
  Unsubscribable,
} from '@graphiql/toolkit';

import { Tab, TabAddButton, Tabs } from './Tabs';

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

declare namespace window {
  export let g: GraphiQLWithContext;
}

export type Maybe<T> = T | null | undefined;

type OnMouseMoveFn = Maybe<
  (moveEvent: MouseEvent | React.MouseEvent<Element>) => void
>;
type OnMouseUpFn = Maybe<() => void>;

export type GraphiQLToolbarConfig = {
  additionalContent?: React.ReactNode;
};

/**
 * API docs for this live here:
 *
 * https://graphiql-test.netlify.app/typedoc/modules/graphiql.html#graphiqlprops
 */
export type GraphiQLProps = {
  /**
   * Required. A function which accepts GraphQL-HTTP parameters and returns a Promise, Observable or AsyncIterable
   * which resolves to the GraphQL parsed JSON response.
   *
   * We suggest using `@graphiql/toolkit` `createGraphiQLFetcher()` to cover most implementations,
   * including custom headers, websockets and even incremental delivery for @defer and @stream.
   *
   * [`GraphiQL Create Fetcher documentation`](https://graphiql-test.netlify.app/typedoc/modules/graphiql-toolkit.html#fetcher)
   *  **Required.**
   */
  fetcher: Fetcher;
  /**
   * Optionally provide the `GraphQLSchema`. If present, GraphiQL skips schema introspection.
   */
  schema?: GraphQLSchema | null;
  /**
   * An array of graphql ValidationRules
   */
  validationRules?: ValidationRule[];
  /**
   * Optionally provide the query in a controlled-component manner. This will override the user state.
   *
   * If you just want to provide a different initial query, use `defaultQuery`
   */
  query?: string;
  /**
   * Same as above. provide a json string that controls the present variables editor state.
   */
  variables?: string;
  /**
   * provide a json string that controls the headers editor state
   */
  headers?: string;
  /**
   * The operationName to use when executing the current operation.
   * Overrides the dropdown when multiple operations are present.
   */
  operationName?: string;
  /**
   * provide a json string that controls the results editor state
   */
  response?: string;
  /**
   * Provide a custom storage API, as an alternative to localStorage.
   * [`Storage`](https://graphiql-test.netlify.app/typedoc/interfaces/graphiql.storage.html
   * default: StorageAPI
   */
  storage?: Storage;
  /**
   * The defaultQuery present when the editor is first loaded
   * and the user has no local query editing state
   * @default "A really long graphql # comment that welcomes you to GraphiQL"
   */
  defaultQuery?: string;
  /**
   * Should the variables editor be open by default?
   * default: true
   */
  defaultVariableEditorOpen?: boolean;
  /**
   * Should the "secondary editor" that contains both headers or variables be open by default?
   * default: true
   */
  defaultSecondaryEditorOpen?: boolean;
  /**
   * Should the headers editor even be enabled?
   * Note that you can still pass custom headers in the fetcher
   * default: true
   */
  headerEditorEnabled?: boolean;
  /**
   * Should user header changes be persisted to localstorage?
   * default: false
   */
  shouldPersistHeaders?: boolean;
  /**
   * Provide an array of fragment nodes or a string to append to queries,
   * and for validation and completion
   */
  externalFragments?: string | FragmentDefinitionNode[];
  /**
   * Handler for when a user copies a query
   */
  onCopyQuery?: (query?: string) => void;
  /**
   * Handler for when a user edits a query.
   */
  onEditQuery?: (query?: string, documentAST?: DocumentNode) => void;
  /**
   * Handler for when a user edits variables.
   */
  onEditVariables?: (value: string) => void;
  /**
   * Handler for when a user edits headers.
   */
  onEditHeaders?: (value: string) => void;
  /**
   * Handler for when a user edits operation names
   */
  onEditOperationName?: (operationName: string) => void;
  /**
   * Handler for when the user toggles the doc pane
   */
  onToggleDocs?: (docExplorerOpen: boolean) => void;
  /**
   * A custom function to determine which field leafs are automatically
   * added when fill leafs command is used
   */
  getDefaultFieldNames?: GetDefaultFieldNamesFn;
  /**
   * The codemirror editor theme you'd like to use
   *
   */
  editorTheme?: string;
  /**
   * On history pane toggle event
   */
  onToggleHistory?: (historyPaneOpen: boolean) => void;
  /**
   * Custom results tooltip component
   */
  ResultsTooltip?: ResponseTooltipType;
  /**
   * decide whether schema responses should be validated.
   *
   * default: false
   */
  dangerouslyAssumeSchemaIsValid?: boolean;
  /**
   * Enable new introspectionQuery option `inputValueDeprecation`
   * DANGER: your server must be configured to support this new feature,
   * or else introspection will fail with an invalid query
   *
   * default: false
   */
  inputValueDeprecation?: boolean;
  /**
   * Enable new introspectionQuery option `schemaDescription`, which expects the `__Schema.description` field
   * DANGER: your server must be configured to support a `__Schema.description` field on
   * introspection or it will fail with an invalid query.
   *
   * default: false
   */
  schemaDescription?: boolean;
  /**
   * OperationName to use for introspection queries
   *
   * default: false
   *
   */
  introspectionQueryName?: string;
  /**
   * Set codemirror editors to readOnly state
   */
  readOnly?: boolean;
  /**
   * Toggle the doc explorer state by default/programmatically
   *
   * default: false
   */
  docExplorerOpen?: boolean;
  /**
   * Custom toolbar configuration
   */
  toolbar?: GraphiQLToolbarConfig;
  /**
   * Max query history to retain
   * default: 20
   */
  maxHistoryLength?: number;
  /**
   * Callback that is invoked once a remote schema has been fetched.
   */
  onSchemaChange?: (schema: GraphQLSchema) => void;
  /**
   * Content to place before the top bar (logo).
   */
  beforeTopBarContent?: React.ReactElement | null;

  /**
   * Whether tabs should be enabled.
   * default: false
   */
  tabs?:
    | boolean
    | {
        /**
         * Callback that is invoked onTabChange.
         */
        onTabChange?: (tab: TabsState) => void;
      };

  children?: ReactNode;
};

export type GraphiQLState = {
  response?: string;
  editorFlex: number;
  secondaryEditorOpen: boolean;
  secondaryEditorHeight: number;
  variableEditorActive: boolean;
  headerEditorActive: boolean;
  headerEditorEnabled: boolean;
  shouldPersistHeaders: boolean;
  docExplorerWidth: number;
  isWaitingForResponse: boolean;
  subscription?: Unsubscribable | null;
};

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */
export function GraphiQL({
  dangerouslyAssumeSchemaIsValid,
  docExplorerOpen,
  inputValueDeprecation,
  introspectionQueryName,
  maxHistoryLength,
  onToggleHistory,
  onToggleDocs,
  storage,
  schema,
  schemaDescription,
  ...props
}: GraphiQLProps) {
  return (
    <StorageContextProvider storage={storage}>
      <EditorContextProvider
        defaultQuery={props.defaultQuery}
        headers={props.headers}
        query={props.query}
        variables={props.variables}>
        <SchemaContextProvider
          dangerouslyAssumeSchemaIsValid={dangerouslyAssumeSchemaIsValid}
          fetcher={props.fetcher}
          inputValueDeprecation={inputValueDeprecation}
          introspectionQueryName={introspectionQueryName}
          schema={schema}
          schemaDescription={schemaDescription}>
          <ExplorerContextProvider
            isVisible={docExplorerOpen}
            onToggleVisibility={onToggleDocs}>
            <HistoryContextProvider
              maxHistoryLength={maxHistoryLength}
              onToggle={onToggleHistory}>
              <GraphiQLConsumeContexts {...props} />
            </HistoryContextProvider>
          </ExplorerContextProvider>
        </SchemaContextProvider>
      </EditorContextProvider>
    </StorageContextProvider>
  );
}

GraphiQL.formatResult = (result: any): string => {
  console.warn(
    'The function `GraphiQL.formatResult` is deprecated and will be removed in the next major version. Please switch to using the `formatResult` function provided by the `@graphiql/toolkit` package.',
  );
  return formatResult(result);
};

GraphiQL.formatError = (error: any): string => {
  console.warn(
    'The function `GraphiQL.formatError` is deprecated and will be removed in the next major version. Please switch to using the `formatError` function provided by the `@graphiql/toolkit` package.',
  );
  return formatError(error);
};

// Export main windows/panes to be used separately if desired.
GraphiQL.Logo = GraphiQLLogo;
GraphiQL.Toolbar = GraphiQLToolbar;
GraphiQL.Footer = GraphiQLFooter;
GraphiQL.QueryEditor = QueryEditor;
GraphiQL.VariableEditor = VariableEditor;
GraphiQL.HeaderEditor = HeaderEditor;
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
// GraphiQL.Select = ToolbarSelect;
// GraphiQL.SelectOption = ToolbarSelectOption;

type GraphiQLWithContextProviderProps = Omit<
  GraphiQLProps,
  | 'dangerouslyAssumeSchemaIsValid'
  | 'defaultQuery'
  | 'docExplorerOpen'
  | 'inputValueDeprecation'
  | 'introspectionQueryName'
  | 'maxHistoryLength'
  | 'onToggleDocs'
  | 'onToggleHistory'
  | 'query'
  | 'schema'
  | 'schemaDescription'
  | 'storage'
>;

function GraphiQLConsumeContexts({
  getDefaultFieldNames,
  onCopyQuery,
  ...props
}: GraphiQLWithContextProviderProps) {
  const editorContext = useEditorContext({ nonNull: true });
  const explorerContext = useExplorerContext();
  const historyContext = useHistoryContext();
  const schemaContext = useSchemaContext({ nonNull: true });
  const storageContext = useStorageContext();

  const autoCompleteLeafs = useAutoCompleteLeafs({ getDefaultFieldNames });
  const copy = useCopyQuery({ onCopyQuery });
  const merge = useMergeQuery();
  const prettify = usePrettifyEditors();

  return (
    <GraphiQLWithContext
      {...props}
      editorContext={editorContext}
      explorerContext={explorerContext}
      historyContext={historyContext}
      schemaContext={schemaContext}
      storageContext={storageContext}
      autoCompleteLeafs={autoCompleteLeafs}
      copy={copy}
      merge={merge}
      prettify={prettify}
    />
  );
}

type GraphiQLWithContextConsumerProps = Omit<
  GraphiQLWithContextProviderProps,
  'onCopyQuery' | 'getDefaultFieldNames'
> & {
  editorContext: EditorContextType;
  explorerContext: ExplorerContextType | null;
  historyContext: HistoryContextType | null;
  schemaContext: SchemaContextType;
  storageContext: StorageContextType | null;

  autoCompleteLeafs(): string | undefined;
  copy(): void;
  merge(): void;
  prettify(): void;
};

class GraphiQLWithContext extends React.Component<
  GraphiQLWithContextConsumerProps,
  GraphiQLState
> {
  // Ensure only the last executed editor query is rendered.
  _editorQueryID = 0;

  // Ensure the component is mounted to execute async setState
  componentIsMounted: boolean;

  // refs
  graphiqlContainer: Maybe<HTMLDivElement>;
  editorBarComponent: Maybe<HTMLDivElement>;

  constructor(props: GraphiQLWithContextConsumerProps) {
    super(props);

    // Ensure props are correct
    if (typeof props.fetcher !== 'function') {
      throw new TypeError('GraphiQL requires a fetcher function.');
    }

    // Disable setState when the component is not mounted
    this.componentIsMounted = false;

    const variables =
      props.variables ?? props.storageContext?.get('variables') ?? undefined;

    const headers =
      props.headers ?? props.storageContext?.get('headers') ?? undefined;

    // initial secondary editor pane open
    let secondaryEditorOpen;
    if (props.defaultVariableEditorOpen !== undefined) {
      secondaryEditorOpen = props.defaultVariableEditorOpen;
    } else if (props.defaultSecondaryEditorOpen !== undefined) {
      secondaryEditorOpen = props.defaultSecondaryEditorOpen;
    } else {
      secondaryEditorOpen = Boolean(variables || headers);
    }

    const headerEditorEnabled = props.headerEditorEnabled ?? true;
    const shouldPersistHeaders = props.shouldPersistHeaders ?? false;

    // Initialize state
    this.state = {
      response: '',
      editorFlex: Number(this.props.storageContext?.get('editorFlex')) || 1,
      secondaryEditorOpen,
      secondaryEditorHeight:
        Number(this.props.storageContext?.get('secondaryEditorHeight')) || 200,
      variableEditorActive:
        this.props.storageContext?.get('variableEditorActive') === 'true' ||
        props.headerEditorEnabled
          ? this.props.storageContext?.get('headerEditorActive') !== 'true'
          : true,
      headerEditorActive:
        this.props.storageContext?.get('headerEditorActive') === 'true',
      headerEditorEnabled,
      shouldPersistHeaders,
      docExplorerWidth:
        Number(this.props.storageContext?.get('docExplorerWidth')) ||
        DEFAULT_DOC_EXPLORER_WIDTH,
      isWaitingForResponse: false,
      subscription: null,
    };
  }

  componentDidMount() {
    // Allow async state changes
    this.componentIsMounted = true;

    if (typeof window !== 'undefined') {
      window.g = this;
    }
  }

  UNSAFE_componentWillMount() {
    this.componentIsMounted = false;
  }

  // TODO: these values should be updated in a reducer imo
  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(
    nextProps: GraphiQLWithContextConsumerProps,
  ) {
    let nextResponse = this.state.response;

    if (nextProps.response !== undefined) {
      nextResponse = nextProps.response;
    }

    this.setState({
      response: nextResponse,
    });
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
          onClick={() => {
            this.props.prettify();
          }}
          title="Prettify Query (Shift-Ctrl-P)"
          label="Prettify"
        />
        <ToolbarButton
          onClick={() => {
            this.props.merge();
          }}
          title="Merge Query (Shift-Ctrl-M)"
          label="Merge"
        />
        <ToolbarButton
          onClick={() => {
            this.props.copy();
          }}
          title="Copy Query (Shift-Ctrl-C)"
          label="Copy"
        />
        <ToolbarButton
          onClick={() => this.props.historyContext?.toggle()}
          title={
            this.props.historyContext?.isVisible
              ? 'Hide History'
              : 'Show History'
          }
          label="History"
        />
        {this.props.toolbar?.additionalContent
          ? this.props.toolbar.additionalContent
          : null}
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
        data-testid="graphiql-container"
        className="graphiql-container">
        {this.props.historyContext?.isVisible && (
          <div
            className="historyPaneWrap"
            style={{ width: '230px', zIndex: 7 }}>
            <QueryHistory onSelect={this.handleSelectHistoryQuery} />
          </div>
        )}
        <div className="editorWrap">
          <div className="topBarWrap">
            {this.props.beforeTopBarContent}
            <div className="topBar">
              {logo}
              <ExecuteButton
                isRunning={Boolean(this.state.subscription)}
                onRun={this.handleRunQuery}
                onStop={this.handleStopQuery}
              />
              {toolbar}
            </div>
            {this.props.explorerContext &&
              !this.props.explorerContext.isVisible && (
                <button
                  className="docExplorerShow"
                  onClick={() => {
                    this.props.explorerContext?.show();
                  }}
                  aria-label="Open Documentation Explorer">
                  Docs
                </button>
              )}
          </div>
          {this.props.tabs ? (
            <Tabs
              tabsProps={{
                'aria-label': 'Select active operation',
              }}>
              {this.props.editorContext.tabs.map((tab, index) => (
                <Tab
                  key={tab.id}
                  isActive={index === this.props.editorContext.activeTabIndex}
                  title={tab.title}
                  isCloseable={this.props.editorContext.tabs.length > 1}
                  onSelect={() => {
                    this.handleStopQuery();

                    this.props.editorContext.changeTab(index);
                    this.setState({
                      response:
                        this.props.editorContext.tabs[index].response ??
                        undefined,
                    });
                  }}
                  onClose={() => {
                    if (this.props.editorContext.activeTabIndex === index) {
                      this.handleStopQuery();
                    }

                    this.props.editorContext.closeTab(index);
                    this.setState({
                      response:
                        this.props.editorContext.tabs[
                          Math.max(
                            this.props.editorContext.activeTabIndex - 1,
                            0,
                          )
                        ].response ?? undefined,
                    });
                  }}
                  tabProps={{
                    'aria-controls': 'sessionWrap',
                    id: `session-tab-${index}`,
                  }}
                />
              ))}
              <TabAddButton
                onClick={() => {
                  this.props.editorContext.addTab();
                  this.setState({ response: undefined });
                }}
              />
            </Tabs>
          ) : null}
          <div
            ref={n => {
              this.editorBarComponent = n;
            }}
            role="tabpanel"
            id="sessionWrap"
            className="editorBar"
            aria-labelledby={`session-tab-${this.props.editorContext.activeTabIndex}`}
            onDoubleClick={this.handleResetResize}
            onMouseDown={this.handleResizeStart}>
            <div className="queryWrap" style={queryWrapStyle}>
              <QueryEditor
                editorTheme={this.props.editorTheme}
                externalFragments={this.props.externalFragments}
                onEdit={this.handleEditQuery}
                onEditOperationName={this.props.onEditOperationName}
                onRunQuery={this.handleEditorRunQuery}
                readOnly={this.props.readOnly}
                validationRules={this.props.validationRules}
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
                    className={`variable-editor-title-text${
                      this.state.variableEditorActive ? ' active' : ''
                    }`}
                    onClick={this.handleOpenVariableEditorTab}
                    onMouseDown={this.handleTabClickPropagation}>
                    Query Variables
                  </div>
                  {this.state.headerEditorEnabled && (
                    <div
                      style={{
                        marginLeft: '20px',
                      }}
                      className={`variable-editor-title-text${
                        this.state.headerEditorActive ? ' active' : ''
                      }`}
                      onClick={this.handleOpenHeaderEditorTab}
                      onMouseDown={this.handleTabClickPropagation}>
                      Request Headers
                    </div>
                  )}
                </div>
                <VariableEditor
                  onEdit={this.handleEditVariables}
                  onRunQuery={this.handleEditorRunQuery}
                  editorTheme={this.props.editorTheme}
                  readOnly={this.props.readOnly}
                  active={this.state.variableEditorActive}
                />
                {this.state.headerEditorEnabled && (
                  <HeaderEditor
                    active={this.state.headerEditorActive}
                    editorTheme={this.props.editorTheme}
                    onEdit={this.handleEditHeaders}
                    onRunQuery={this.handleEditorRunQuery}
                    readOnly={this.props.readOnly}
                    shouldPersistHeaders={this.props.shouldPersistHeaders}
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
                value={this.state.response}
                editorTheme={this.props.editorTheme}
                ResponseTooltip={this.props.ResultsTooltip}
              />
              {footer}
            </div>
          </div>
        </div>
        {this.props.explorerContext?.isVisible && (
          <div className={docExplorerWrapClasses} style={docWrapStyle}>
            <div
              className="docExplorerResizer"
              onDoubleClick={this.handleDocsResetResize}
              onMouseDown={this.handleDocsResizeStart}
            />
            <DocExplorer />
          </div>
        )}
      </div>
    );
  }

  /**
   * Get the query editor CodeMirror instance.
   *
   * @public
   */
  getQueryEditor() {
    return this.props.editorContext.queryEditor || null;
  }

  /**
   * Get the variable editor CodeMirror instance.
   *
   * @public
   */
  public getVariableEditor() {
    return this.props.editorContext.variableEditor || null;
  }

  /**
   * Get the header editor CodeMirror instance.
   *
   * @public
   */
  public getHeaderEditor() {
    return this.props.editorContext.headerEditor || null;
  }

  /**
   * Refresh all CodeMirror instances.
   *
   * @public
   */
  public refresh() {
    this.props.editorContext.queryEditor?.refresh();
    this.props.editorContext.variableEditor?.refresh();
    this.props.editorContext.headerEditor?.refresh();
    this.props.editorContext.responseEditor?.refresh();
  }

  /**
   * Inspect the query, automatically filling in selection sets for non-leaf
   * fields which do not yet have them.
   *
   * @public
   */
  public autoCompleteLeafs() {
    console.warn(
      'The method `GraphiQL.autoCompleteLeafs` is deprecated and will be removed in the next major version. Please switch to using the `autoCompleteLeafs` function provided by the `EditorContext` from the `@graphiql/react` package.',
    );
    return this.props.autoCompleteLeafs();
  }

  // Private methods

  private async _fetchQuery(
    query: string,
    variables: string | undefined,
    headers: string | undefined,
    operationName: string | undefined,
    shouldPersistHeaders: boolean,
    cb: (value: FetcherResult) => any,
  ): Promise<null | Unsubscribable> {
    const fetcher = this.props.fetcher;
    let jsonVariables = null;
    let jsonHeaders = null;

    try {
      jsonVariables =
        variables && variables.trim() !== '' ? JSON.parse(variables) : null;
    } catch (error) {
      throw new Error(
        `Variables are invalid JSON: ${(error as Error).message}.`,
      );
    }

    if (typeof jsonVariables !== 'object') {
      throw new Error('Variables are not a JSON object.');
    }

    try {
      jsonHeaders =
        headers && headers.trim() !== '' ? JSON.parse(headers) : null;
    } catch (error) {
      throw new Error(`Headers are invalid JSON: ${(error as Error).message}.`);
    }

    if (typeof jsonHeaders !== 'object') {
      throw new Error('Headers are not a JSON object.');
    }

    const documentAST =
      this.props.editorContext.queryEditor?.documentAST ?? undefined;
    // TODO: memoize this
    if (this.props.externalFragments) {
      const externalFragments = new Map<string, FragmentDefinitionNode>();

      if (Array.isArray(this.props.externalFragments)) {
        this.props.externalFragments.forEach(def => {
          externalFragments.set(def.name.value, def);
        });
      } else {
        visit(parse(this.props.externalFragments, {}), {
          FragmentDefinition(def) {
            externalFragments.set(def.name.value, def);
          },
        });
      }

      const fragmentDependencies = documentAST
        ? getFragmentDependenciesForAST(documentAST, externalFragments)
        : [];
      if (fragmentDependencies.length > 0) {
        query +=
          '\n' +
          fragmentDependencies
            .map((node: FragmentDefinitionNode) => print(node))
            .join('\n');
      }
    }

    const fetch = fetcher(
      { query, variables: jsonVariables, operationName },
      { headers: jsonHeaders, shouldPersistHeaders, documentAST },
    );

    return Promise.resolve<SyncFetcherResult>(fetch)
      .then(value => {
        if (isObservable(value)) {
          // If the fetcher returned an Observable, then subscribe to it, calling
          // the callback on each next value, and handling both errors and the
          // completion of the Observable. Returns a Subscription object.
          const subscription = value.subscribe({
            next: cb,
            error: (error: Error) => {
              this.safeSetState({
                isWaitingForResponse: false,
                response: error ? formatError(error) : undefined,
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
        } else if (isAsyncIterable(value)) {
          (async () => {
            try {
              for await (const result of value) {
                cb(result);
              }
              this.safeSetState({
                isWaitingForResponse: false,
                subscription: null,
              });
            } catch (error) {
              this.safeSetState({
                isWaitingForResponse: false,
                response: error ? formatError(error as Error) : undefined,
                subscription: null,
              });
            }
          })();

          return {
            unsubscribe: () => value[Symbol.asyncIterator]().return?.(),
          };
        } else {
          cb(value);
          return null;
        }
      })
      .catch(error => {
        this.safeSetState({
          isWaitingForResponse: false,
          response: error ? formatError(error) : undefined,
        });
        return null;
      });
  }

  handleRunQuery = async (selectedOperationName?: string) => {
    this._editorQueryID++;
    const queryID = this._editorQueryID;

    // Use the edited query after autoCompleteLeafs() runs or,
    // in case autoCompletion fails (the function returns undefined),
    // the current query from the editor.
    const editedQuery =
      this.props.autoCompleteLeafs() || getQuery(this.props) || '';
    const variables = getVariables(this.props);
    const headers = getHeaders(this.props);
    const shouldPersistHeaders = this.state.shouldPersistHeaders;
    let operationName =
      this.props.editorContext.queryEditor?.operationName ?? undefined;

    // If an operation was explicitly provided, different from the current
    // operation name, then report that it changed.
    if (selectedOperationName && selectedOperationName !== operationName) {
      operationName = selectedOperationName;
      if (this.props.editorContext.queryEditor) {
        this.props.editorContext.queryEditor.operationName = selectedOperationName;
      }
      this.props.onEditOperationName?.(operationName);
    }

    try {
      this.setState({ isWaitingForResponse: true, response: undefined });

      this.props.historyContext?.addToHistory({
        query: editedQuery,
        variables,
        headers,
        operationName,
      });

      // when dealing with defer or stream, we need to aggregate results
      let fullResponse: FetcherResultPayload = { data: {} };

      // _fetchQuery may return a subscription.
      const subscription = await this._fetchQuery(
        editedQuery,
        variables,
        headers,
        operationName,
        shouldPersistHeaders,
        (result: FetcherResult) => {
          if (queryID === this._editorQueryID) {
            let maybeMultipart = Array.isArray(result) ? result : false;
            if (
              !maybeMultipart &&
              typeof result === 'object' &&
              result !== null &&
              'hasNext' in result
            ) {
              maybeMultipart = [result];
            }

            if (maybeMultipart) {
              const payload: FetcherResultPayload = { data: fullResponse.data };
              const maybeErrors = [
                ...(fullResponse?.errors || []),
                ...maybeMultipart
                  .map(i => i.errors)
                  .flat()
                  .filter(Boolean),
              ];

              if (maybeErrors.length) {
                payload.errors = maybeErrors;
              }

              for (const part of maybeMultipart) {
                // We pull out errors here, so we dont include it later
                const { path, data, errors: _errors, ...rest } = part;
                if (path) {
                  if (!data) {
                    throw new Error(
                      `Expected part to contain a data property, but got ${part}`,
                    );
                  }

                  setValue(payload.data, path, data, { merge: true });
                } else if (data) {
                  // If there is no path, we don't know what to do with the payload,
                  // so we just set it.
                  payload.data = part.data;
                }

                // Ensures we also bring extensions and alike along for the ride
                fullResponse = {
                  ...payload,
                  ...rest,
                };
              }

              this.setState({
                isWaitingForResponse: false,
                response: formatResult(fullResponse),
              });
            } else {
              const response = formatResult(result);
              this.setState({
                isWaitingForResponse: false,
                response,
              });
              this.props.editorContext.updateActiveTabValues({ response });
            }
          }
        },
      );

      this.setState({ subscription });
    } catch (error) {
      this.setState({
        isWaitingForResponse: false,
        response: (error as Error).message,
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
    const operations = this.props.editorContext.queryEditor?.operations;
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

  handleEditQuery = (value: string) => {
    this.props.onEditQuery?.(
      value,
      this.props.editorContext.queryEditor?.documentAST ?? undefined,
    );
  };

  handleEditVariables = (value: string) => {
    if (this.props.onEditVariables) {
      this.props.onEditVariables(value);
    }
  };

  handleEditHeaders = (value: string) => {
    if (this.props.onEditHeaders) {
      this.props.onEditHeaders(value);
    }
  };

  handleEditorRunQuery = () => {
    this._runQueryAtCursor();
  };

  handleSelectHistoryQuery = ({
    query,
    variables,
    headers,
    operationName,
  }: QueryStoreItem) => {
    if (query) {
      setQuery(this.props, query);
    }
    if (variables) {
      setVariables(this.props, variables);
    }
    if (headers) {
      setHeaders(this.props, headers);
    }
    if (operationName) {
      this.props.onEditOperationName?.(operationName);
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
        this.props.storageContext?.set(
          'editorFlex',
          JSON.stringify(this.state.editorFlex),
        ),
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
    this.props.storageContext?.set(
      'editorFlex',
      JSON.stringify(this.state.editorFlex),
    );
  };

  private _didClickDragBar(event: React.MouseEvent) {
    // Only for primary unmodified clicks
    if (event.button !== 0 || event.ctrlKey) {
      return false;
    }
    const target = event.target;
    if (!(target instanceof Element)) {
      return false;
    }
    // We use codemirror's gutter as the drag bar.
    if (target.className.indexOf('CodeMirror-gutter') !== 0) {
      return false;
    }
    // Specifically the result window's drag bar.
    const resultWindow = target.closest('section');
    return resultWindow ? resultWindow.id === RESULT_VIEWER_ID : false;
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
        this.props.explorerContext?.hide();
      } else {
        this.props.explorerContext?.show();
        this.setState({ docExplorerWidth: Math.min(docsSize, 650) });
        debounce(500, () =>
          this.props.storageContext?.set(
            'docExplorerWidth',
            JSON.stringify(this.state.docExplorerWidth),
          ),
        )();
      }
    };

    let onMouseUp: OnMouseUpFn = () => {
      if (this.props.explorerContext && !this.props.explorerContext.isVisible) {
        this.setState({ docExplorerWidth: hadWidth });
        debounce(500, () =>
          this.props.storageContext?.set(
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
      this.props.storageContext?.set(
        'docExplorerWidth',
        JSON.stringify(this.state.docExplorerWidth),
      ),
    )();
  };

  // Prevent clicking on the tab button from propagating to the resizer.
  private handleTabClickPropagation: MouseEventHandler<
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
        this.props.storageContext?.set(
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
          Graph
          <em>i</em>
          QL
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

function getQuery(props: GraphiQLWithContextConsumerProps) {
  return props.editorContext.queryEditor?.getValue();
}

function setQuery(props: GraphiQLWithContextConsumerProps, value: string) {
  props.editorContext.queryEditor?.setValue(value);
}

function getVariables(props: GraphiQLWithContextConsumerProps) {
  return props.editorContext.variableEditor?.getValue();
}

function setVariables(props: GraphiQLWithContextConsumerProps, value: string) {
  props.editorContext.variableEditor?.setValue(value);
}

function getHeaders(props: GraphiQLWithContextConsumerProps) {
  return props.editorContext.headerEditor?.getValue();
}

function setHeaders(props: GraphiQLWithContextConsumerProps, value: string) {
  props.editorContext.headerEditor?.setValue(value);
}
