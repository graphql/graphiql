/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, {
  ComponentType,
  PropsWithChildren,
  ReactNode,
  forwardRef,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';
import {
  GraphQLSchema,
  ValidationRule,
  FragmentDefinitionNode,
  DocumentNode,
  IntrospectionQuery,
} from 'graphql';

import {
  EditorContextProvider,
  ExecutionContextProvider,
  ExecutionContextType,
  ExplorerContextProvider,
  HistoryContextProvider,
  SchemaContextProvider,
  StorageContextProvider,
  useAutoCompleteLeafs,
  useCopyQuery,
  useDragResize,
  useEditorContext,
  useExecutionContext,
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
  KeyMap,
} from '@graphiql/react';

import { ExecuteButton } from './ExecuteButton';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarMenu, ToolbarMenuItem } from './ToolbarMenu';
import { QueryEditor } from './QueryEditor';
import { VariableEditor } from './VariableEditor';
import { HeaderEditor } from './HeaderEditor';
import { ResultViewer } from './ResultViewer';
import { DocExplorer } from './DocExplorer';
import { QueryHistory } from './QueryHistory';
import find from '../utility/find';

import { formatError, formatResult } from '@graphiql/toolkit';
import type { Fetcher, GetDefaultFieldNamesFn } from '@graphiql/toolkit';

import { Tab, TabAddButton, Tabs } from './Tabs';

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
  export let g: GraphiQL;
}

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
   * Optionally provide the `GraphQLSchema`. If present, GraphiQL skips schema
   * introspection. This prop also accepts the result of an introspection query
   * which will be used to create a `GraphQLSchema`
   */
  schema?: GraphQLSchema | IntrospectionQuery | null;
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
   * Should user header changes be persisted to localStorage?
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
   * The CodeMirror 5 editor theme you'd like to use
   *
   */
  editorTheme?: string;
  /**
   * The CodeMirror 5 editor keybindings you'd like to use
   *
   * Note: may be deprecated for monaco
   *
   * See: https://codemirror.net/5/doc/manual.html#option_keyMap
   *
   * @default 'sublime'
   */
  keyMap?: KeyMap;
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

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */
export class GraphiQL extends React.Component<GraphiQLProps> {
  ref: GraphiQLWithContext | null = null;

  constructor(props: GraphiQLProps) {
    super(props);
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      window.g = this;
    }
  }

  render() {
    return (
      <GraphiQLProviders
        {...this.props}
        ref={node => {
          this.ref = node;
        }}
      />
    );
  }

  /**
   * Get the query editor CodeMirror instance.
   *
   * @public
   */
  public getQueryEditor() {
    console.warn(
      'The method `GraphiQL.getQueryEditor` is deprecated and will be removed in the next major version. To set the value of the editor you can use the `query` prop. To react on changes of the editor value you can pass a callback to the `onEditQuery` prop.',
    );
    return this.ref?.getQueryEditor() || null;
  }

  /**
   * Get the variable editor CodeMirror instance.
   *
   * @public
   */
  public getVariableEditor() {
    console.warn(
      'The method `GraphiQL.getVariableEditor` is deprecated and will be removed in the next major version. To set the value of the editor you can use the `variables` prop. To react on changes of the editor value you can pass a callback to the `onEditVariables` prop.',
    );
    return this.ref?.getVariableEditor() || null;
  }

  /**
   * Get the header editor CodeMirror instance.
   *
   * @public
   */
  public getHeaderEditor() {
    console.warn(
      'The method `GraphiQL.getHeaderEditor` is deprecated and will be removed in the next major version. To set the value of the editor you can use the `headers` prop. To react on changes of the editor value you can pass a callback to the `onEditHeaders` prop.',
    );
    return this.ref?.getHeaderEditor() || null;
  }

  /**
   * Refresh all CodeMirror instances.
   *
   * @public
   */
  public refresh() {
    console.warn(
      'The method `GraphiQL.refresh` is deprecated and will be removed in the next major version. Already now, all editors should automatically refresh when their size changes.',
    );
    this.ref?.refresh();
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
    return this.ref?.autoCompleteLeafs();
  }

  // Static methods

  static formatResult = (result: any): string => {
    console.warn(
      'The function `GraphiQL.formatResult` is deprecated and will be removed in the next major version. Please switch to using the `formatResult` function provided by the `@graphiql/toolkit` package.',
    );
    return formatResult(result);
  };

  static formatError = (error: any): string => {
    console.warn(
      'The function `GraphiQL.formatError` is deprecated and will be removed in the next major version. Please switch to using the `formatError` function provided by the `@graphiql/toolkit` package.',
    );
    return formatError(error);
  };

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
}

const GraphiQLProviders: ForwardRefExoticComponent<
  GraphiQLProps & RefAttributes<GraphiQLWithContext>
> = forwardRef<GraphiQLWithContext, GraphiQLProps>(function GraphiQLProviders(
  {
    dangerouslyAssumeSchemaIsValid,
    docExplorerOpen,
    externalFragments,
    fetcher,
    headers,
    inputValueDeprecation,
    introspectionQueryName,
    maxHistoryLength,
    onEditOperationName,
    onSchemaChange,
    onToggleHistory,
    onToggleDocs,
    operationName,
    query,
    response,
    storage,
    schema,
    schemaDescription,
    shouldPersistHeaders,
    validationRules,
    variables,
    ...props
  },
  ref,
) {
  // Ensure props are correct
  if (typeof fetcher !== 'function') {
    throw new TypeError('GraphiQL requires a fetcher function.');
  }

  return (
    <StorageContextProvider storage={storage}>
      <HistoryContextProvider
        maxHistoryLength={maxHistoryLength}
        onToggle={onToggleHistory}
      >
        <EditorContextProvider
          defaultQuery={props.defaultQuery}
          externalFragments={externalFragments}
          headers={headers}
          onEditOperationName={onEditOperationName}
          onTabChange={
            typeof props.tabs === 'object' ? props.tabs.onTabChange : undefined
          }
          query={query}
          response={response}
          shouldPersistHeaders={shouldPersistHeaders}
          validationRules={validationRules}
          variables={variables}
        >
          <SchemaContextProvider
            dangerouslyAssumeSchemaIsValid={dangerouslyAssumeSchemaIsValid}
            fetcher={fetcher}
            inputValueDeprecation={inputValueDeprecation}
            introspectionQueryName={introspectionQueryName}
            onSchemaChange={onSchemaChange}
            schema={schema}
            schemaDescription={schemaDescription}
          >
            <ExecutionContextProvider
              fetcher={fetcher}
              operationName={operationName}
            >
              <ExplorerContextProvider
                isVisible={docExplorerOpen}
                onToggleVisibility={onToggleDocs}
              >
                <GraphiQLConsumeContexts {...props} ref={ref} />
              </ExplorerContextProvider>
            </ExecutionContextProvider>
          </SchemaContextProvider>
        </EditorContextProvider>
      </HistoryContextProvider>
    </StorageContextProvider>
  );
}) as any;

// Add a select-option input to the Toolbar.
// GraphiQL.Select = ToolbarSelect;
// GraphiQL.SelectOption = ToolbarSelectOption;

type GraphiQLWithContextProviderProps = Omit<
  GraphiQLProps,
  | 'dangerouslyAssumeSchemaIsValid'
  | 'defaultQuery'
  | 'docExplorerOpen'
  | 'externalFragments'
  | 'fetcher'
  | 'headers'
  | 'inputValueDeprecation'
  | 'introspectionQueryName'
  | 'maxHistoryLength'
  | 'onEditOperationName'
  | 'onSchemaChange'
  | 'onToggleDocs'
  | 'onToggleHistory'
  | 'operationName'
  | 'query'
  | 'response'
  | 'schema'
  | 'schemaDescription'
  | 'shouldPersistHeaders'
  | 'storage'
  | 'validationRules'
  | 'variables'
>;

const GraphiQLConsumeContexts = forwardRef<
  GraphiQLWithContext,
  GraphiQLWithContextProviderProps
>(function GraphiQLConsumeContexts({ getDefaultFieldNames, ...props }, ref) {
  const editorContext = useEditorContext({ nonNull: true });
  const executionContext = useExecutionContext({ nonNull: true });
  const explorerContext = useExplorerContext();
  const historyContext = useHistoryContext();
  const schemaContext = useSchemaContext({ nonNull: true });
  const storageContext = useStorageContext();

  const autoCompleteLeafs = useAutoCompleteLeafs({ getDefaultFieldNames });
  const copy = useCopyQuery({ onCopyQuery: props.onCopyQuery });
  const merge = useMergeQuery();
  const prettify = usePrettifyEditors();

  const docResize = useDragResize({
    defaultSizeRelation: 3,
    direction: 'horizontal',
    initiallyHidden: explorerContext?.isVisible ? undefined : 'second',
    onHiddenElementChange: resizableElement => {
      if (resizableElement === 'second') {
        explorerContext?.hide();
      } else {
        explorerContext?.show();
      }
    },
    sizeThresholdSecond: 200,
    storageKey: 'docExplorerFlex',
  });
  const editorResize = useDragResize({
    direction: 'horizontal',
    storageKey: 'editorFlex',
  });
  const secondaryEditorResize = useDragResize({
    defaultSizeRelation: 3,
    direction: 'vertical',
    initiallyHidden: (() => {
      // initial secondary editor pane open
      if (props.defaultVariableEditorOpen !== undefined) {
        return props.defaultVariableEditorOpen ? undefined : 'second';
      }

      if (props.defaultSecondaryEditorOpen !== undefined) {
        return props.defaultSecondaryEditorOpen ? undefined : 'second';
      }

      return editorContext.initialVariables || editorContext.initialHeaders
        ? undefined
        : 'second';
    })(),
    sizeThresholdSecond: 60,
    storageKey: 'secondaryEditorFlex',
  });

  return (
    <GraphiQLWithContext
      {...props}
      editorContext={editorContext}
      executionContext={executionContext}
      explorerContext={explorerContext}
      historyContext={historyContext}
      schemaContext={schemaContext}
      storageContext={storageContext}
      autoCompleteLeafs={autoCompleteLeafs}
      copy={copy}
      merge={merge}
      prettify={prettify}
      docResize={docResize}
      editorResize={editorResize}
      secondaryEditorResize={secondaryEditorResize}
      ref={ref}
    />
  );
});

type GraphiQLWithContextConsumerProps = Omit<
  GraphiQLWithContextProviderProps,
  'fetcher' | 'getDefaultFieldNames'
> & {
  editorContext: EditorContextType;
  executionContext: ExecutionContextType;
  explorerContext: ExplorerContextType | null;
  historyContext: HistoryContextType | null;
  schemaContext: SchemaContextType;
  storageContext: StorageContextType | null;

  autoCompleteLeafs(): string | undefined;
  copy(): void;
  merge(): void;
  prettify(): void;

  docResize: ReturnType<typeof useDragResize>;
  editorResize: ReturnType<typeof useDragResize>;
  secondaryEditorResize: ReturnType<typeof useDragResize>;
};

export type GraphiQLState = {
  activeSecondaryEditor: 'variable' | 'header';
};

class GraphiQLWithContext extends React.Component<
  GraphiQLWithContextConsumerProps,
  GraphiQLState
> {
  constructor(props: GraphiQLWithContextConsumerProps) {
    super(props);

    // Initialize state
    this.state = { activeSecondaryEditor: 'variable' };
  }

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
        <ToolbarButton
          onClick={() => this.props.schemaContext.introspect()}
          title="Fetch GraphQL schema using introspection (Shift-Ctrl-R)"
          label="Introspect"
        />
        {this.props.toolbar?.additionalContent
          ? this.props.toolbar.additionalContent
          : null}
      </GraphiQL.Toolbar>
    );

    const footer = find(children, child =>
      isChildComponentType(child, GraphiQL.Footer),
    );

    const headerEditorEnabled = this.props.headerEditorEnabled ?? true;

    return (
      <div data-testid="graphiql-container" className="graphiql-container">
        <div ref={this.props.docResize.firstRef}>
          {this.props.historyContext?.isVisible && (
            <div
              className="historyPaneWrap"
              style={{ width: '230px', zIndex: 7 }}
            >
              <QueryHistory />
            </div>
          )}
          <div className="editorWrap">
            <div className="topBarWrap">
              {this.props.beforeTopBarContent}
              <div className="topBar">
                {logo}
                <ExecuteButton />
                {toolbar}
              </div>
              {this.props.explorerContext &&
                !this.props.explorerContext.isVisible && (
                  <button
                    type="button"
                    className="docExplorerShow"
                    onClick={() => {
                      this.props.explorerContext?.show();
                      this.props.docResize.setHiddenElement(null);
                    }}
                    aria-label="Open Documentation Explorer"
                  >
                    Docs
                  </button>
                )}
            </div>
            {this.props.tabs ? (
              <Tabs
                tabsProps={{
                  'aria-label': 'Select active operation',
                }}
              >
                {this.props.editorContext.tabs.map((tab, index) => (
                  <Tab
                    key={tab.id}
                    isActive={index === this.props.editorContext.activeTabIndex}
                    title={tab.title}
                    isCloseable={this.props.editorContext.tabs.length > 1}
                    onSelect={() => {
                      this.props.executionContext.stop();
                      this.props.editorContext.changeTab(index);
                    }}
                    onClose={() => {
                      if (this.props.editorContext.activeTabIndex === index) {
                        this.props.executionContext.stop();
                      }
                      this.props.editorContext.closeTab(index);
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
                  }}
                />
              </Tabs>
            ) : null}
            <div
              role="tabpanel"
              id="sessionWrap"
              className="editorBar"
              aria-labelledby={`session-tab-${this.props.editorContext.activeTabIndex}`}
            >
              <div ref={this.props.editorResize.firstRef}>
                <div className="queryWrap">
                  <div ref={this.props.secondaryEditorResize.firstRef}>
                    <QueryEditor
                      editorTheme={this.props.editorTheme}
                      onClickReference={() => {
                        if (this.props.docResize.hiddenElement === 'second') {
                          this.props.docResize.setHiddenElement(null);
                        }
                      }}
                      keyMap={this.props.keyMap}
                      onCopyQuery={this.props.onCopyQuery}
                      onEdit={this.props.onEditQuery}
                      readOnly={this.props.readOnly}
                    />
                  </div>
                  <div ref={this.props.secondaryEditorResize.dragBarRef}>
                    <div
                      className="secondary-editor-title variable-editor-title"
                      id="secondary-editor-title"
                    >
                      <div
                        className={`variable-editor-title-text${
                          this.state.activeSecondaryEditor === 'variable'
                            ? ' active'
                            : ''
                        }`}
                        onClick={() => {
                          if (
                            this.props.secondaryEditorResize.hiddenElement ===
                            'second'
                          ) {
                            this.props.secondaryEditorResize.setHiddenElement(
                              null,
                            );
                          }
                          this.setState(
                            {
                              activeSecondaryEditor: 'variable',
                            },
                            () => {
                              this.props.editorContext.variableEditor?.refresh();
                            },
                          );
                        }}
                      >
                        Query Variables
                      </div>
                      {headerEditorEnabled && (
                        <div
                          style={{
                            marginLeft: '20px',
                          }}
                          className={`variable-editor-title-text${
                            this.state.activeSecondaryEditor === 'header'
                              ? ' active'
                              : ''
                          }`}
                          onClick={() => {
                            if (
                              this.props.secondaryEditorResize.hiddenElement ===
                              'second'
                            ) {
                              this.props.secondaryEditorResize.setHiddenElement(
                                null,
                              );
                            }
                            this.setState(
                              {
                                activeSecondaryEditor: 'header',
                              },
                              () => {
                                this.props.editorContext.headerEditor?.refresh();
                              },
                            );
                          }}
                        >
                          Request Headers
                        </div>
                      )}
                    </div>
                  </div>
                  <div ref={this.props.secondaryEditorResize.secondRef}>
                    <section
                      className="variable-editor secondary-editor"
                      aria-label={
                        this.state.activeSecondaryEditor === 'variable'
                          ? 'Query Variables'
                          : 'Request Headers'
                      }
                    >
                      <VariableEditor
                        onEdit={this.props.onEditVariables}
                        editorTheme={this.props.editorTheme}
                        readOnly={this.props.readOnly}
                        active={this.state.activeSecondaryEditor === 'variable'}
                        keyMap={this.props.keyMap}
                      />
                      {headerEditorEnabled && (
                        <HeaderEditor
                          active={this.state.activeSecondaryEditor === 'header'}
                          editorTheme={this.props.editorTheme}
                          onEdit={this.props.onEditHeaders}
                          readOnly={this.props.readOnly}
                          keyMap={this.props.keyMap}
                        />
                      )}
                    </section>
                  </div>
                </div>
              </div>
              <div ref={this.props.editorResize.dragBarRef}>
                <div className="editor-drag-bar" />
              </div>
              <div ref={this.props.editorResize.secondRef}>
                <div className="resultWrap">
                  {this.props.executionContext.isFetching && (
                    <div className="spinner-container">
                      <div className="spinner" />
                    </div>
                  )}
                  <ResultViewer
                    editorTheme={this.props.editorTheme}
                    ResponseTooltip={this.props.ResultsTooltip}
                    keyMap={this.props.keyMap}
                  />
                  {footer}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div ref={this.props.docResize.dragBarRef}>
          <div className="docExplorerResizer" />
        </div>
        <div ref={this.props.docResize.secondRef}>
          <div className="docExplorerWrap">
            <DocExplorer
              onClose={() => this.props.docResize.setHiddenElement('second')}
            />
          </div>
        </div>
      </div>
    );
  }

  // Public methods

  public getQueryEditor() {
    return this.props.editorContext.queryEditor || null;
  }

  public getVariableEditor() {
    return this.props.editorContext.variableEditor || null;
  }

  public getHeaderEditor() {
    return this.props.editorContext.headerEditor || null;
  }

  public refresh() {
    this.props.editorContext.queryEditor?.refresh();
    this.props.editorContext.variableEditor?.refresh();
    this.props.editorContext.headerEditor?.refresh();
    this.props.editorContext.responseEditor?.refresh();
  }

  public autoCompleteLeafs() {
    return this.props.autoCompleteLeafs();
  }
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
