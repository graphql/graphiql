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
  useState,
} from 'react';
import {
  GraphQLSchema,
  ValidationRule,
  FragmentDefinitionNode,
  DocumentNode,
  IntrospectionQuery,
} from 'graphql';

import {
  Button,
  ButtonGroup,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  Dialog,
  DocExplorer,
  DocsIcon,
  EditorContextProvider,
  ExecuteButton,
  ExecutionContextProvider,
  ExplorerContextProvider,
  HeaderEditor,
  History,
  HistoryContextProvider,
  HistoryIcon,
  KeyboardShortcutIcon,
  KeyMap,
  MergeIcon,
  PlusIcon,
  PrettifyIcon,
  QueryEditor,
  ReloadIcon,
  ResponseEditor,
  ResponseTooltipType,
  SchemaContextProvider,
  SettingsIcon,
  Spinner,
  StorageContextProvider,
  Tab,
  Tabs,
  TabsState,
  ToolbarButton,
  Tooltip,
  UnStyledButton,
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
  useTheme,
  VariableEditor,
} from '@graphiql/react';

import type { Fetcher, GetDefaultFieldNamesFn } from '@graphiql/toolkit';

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
   * Callback that is invoked onTabChange.
   */
  onTabChange?: (tab: TabsState) => void;

  children?: ReactNode;
};

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */
export class GraphiQL extends React.Component<GraphiQLProps> {
  constructor(props: GraphiQLProps) {
    super(props);
  }

  render() {
    return <GraphiQLProviders {...this.props} />;
  }

  // Export main windows/panes to be used separately if desired.
  static Logo = GraphiQLLogo;
  static Toolbar = GraphiQLToolbar;
  static Footer = GraphiQLFooter;
  static QueryEditor = QueryEditor;
  static VariableEditor = VariableEditor;
  static HeaderEditor = HeaderEditor;
  static ResultViewer = ResponseEditor;
}

function GraphiQLProviders({
  dangerouslyAssumeSchemaIsValid,
  docExplorerOpen,
  externalFragments,
  fetcher,
  inputValueDeprecation,
  introspectionQueryName,
  maxHistoryLength,
  onSchemaChange,
  onTabChange,
  onToggleHistory,
  onToggleDocs,
  storage,
  schema,
  schemaDescription,
  shouldPersistHeaders,
  validationRules,
  ...props
}: GraphiQLProps) {
  // Ensure props are correct
  if (typeof fetcher !== 'function') {
    throw new TypeError('GraphiQL requires a fetcher function.');
  }

  return (
    <StorageContextProvider storage={storage}>
      <HistoryContextProvider
        maxHistoryLength={maxHistoryLength}
        onToggle={onToggleHistory}>
        <EditorContextProvider
          defaultQuery={props.defaultQuery}
          externalFragments={externalFragments}
          headers={props.headers}
          onTabChange={onTabChange}
          query={props.query}
          shouldPersistHeaders={shouldPersistHeaders}
          validationRules={validationRules}
          variables={props.variables}>
          <SchemaContextProvider
            dangerouslyAssumeSchemaIsValid={dangerouslyAssumeSchemaIsValid}
            fetcher={fetcher}
            inputValueDeprecation={inputValueDeprecation}
            introspectionQueryName={introspectionQueryName}
            onSchemaChange={onSchemaChange}
            schema={schema}
            schemaDescription={schemaDescription}>
            <ExecutionContextProvider
              fetcher={fetcher}
              onEditOperationName={props.onEditOperationName}>
              <ExplorerContextProvider
                isVisible={docExplorerOpen}
                onToggleVisibility={onToggleDocs}>
                <GraphiQLWithContext {...props} />
              </ExplorerContextProvider>
            </ExecutionContextProvider>
          </SchemaContextProvider>
        </EditorContextProvider>
      </HistoryContextProvider>
    </StorageContextProvider>
  );
}

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
  | 'onSchemaChange'
  | 'onTabChange'
  | 'onToggleDocs'
  | 'onToggleHistory'
  | 'query'
  | 'schema'
  | 'schemaDescription'
  | 'shouldPersistHeaders'
  | 'storage'
  | 'validationRules'
  | 'variables'
>;

function GraphiQLWithContext(props: GraphiQLWithContextProviderProps) {
  const editorContext = useEditorContext({ nonNull: true });
  const executionContext = useExecutionContext({ nonNull: true });
  const explorerContext = useExplorerContext();
  const historyContext = useHistoryContext();
  const schemaContext = useSchemaContext({ nonNull: true });
  const storageContext = useStorageContext();

  const copy = useCopyQuery({ onCopyQuery: props.onCopyQuery });
  const merge = useMergeQuery();
  const prettify = usePrettifyEditors();

  const { theme, setTheme } = useTheme();

  const pluginResize = useDragResize({
    defaultSizeRelation: 1 / 3,
    direction: 'horizontal',
    initiallyHidden:
      explorerContext?.isVisible || historyContext?.isVisible
        ? undefined
        : 'first',
    onHiddenElementChange: resizableElement => {
      if (resizableElement === 'first') {
        explorerContext?.hide();
        historyContext?.hide();
      }
    },
    sizeThresholdSecond: 200,
    storageKey: 'docExplorerFlex',
  });
  const editorResize = useDragResize({
    direction: 'horizontal',
    storageKey: 'editorFlex',
  });
  const editorToolsResize = useDragResize({
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

  const [activeSecondaryEditor, setActiveSecondaryEditor] = useState<
    'variable' | 'header'
  >('variable');
  const [showDialog, setShowDialog] = useState<
    'settings' | 'short-keys' | null
  >(null);
  const [clearStorageStatus, setClearStorageStatus] = useState<
    'success' | 'error' | null
  >(null);

  const children = React.Children.toArray(props.children);

  const logo = children.find(child =>
    isChildComponentType(child, GraphiQL.Logo),
  ) || <GraphiQL.Logo />;

  const toolbar = children.find(child =>
    isChildComponentType(child, GraphiQL.Toolbar),
  ) || (
    <>
      <ToolbarButton
        onClick={() => prettify()}
        label="Prettify query (Shift-Ctrl-P)">
        <PrettifyIcon className="graphiql-toolbar-icon" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => merge()}
        label="Merge fragments into query (Shift-Ctrl-M)">
        <MergeIcon className="graphiql-toolbar-icon" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton onClick={() => copy()} label="Copy query (Shift-Ctrl-C)">
        <CopyIcon className="graphiql-toolbar-icon" aria-hidden="true" />
      </ToolbarButton>
      {props.toolbar?.additionalContent
        ? props.toolbar.additionalContent
        : null}
    </>
  );

  const footer = children.find(child =>
    isChildComponentType(child, GraphiQL.Footer),
  );

  const headerEditorEnabled = props.headerEditorEnabled ?? true;

  const onClickReference = () => {
    if (pluginResize.hiddenElement === 'first') {
      pluginResize.setHiddenElement(null);
    }
  };

  const modifier =
    window.navigator.platform.toLowerCase().indexOf('mac') === 0 ? (
      <code className="graphiql-key">Cmd</code>
    ) : (
      <code className="graphiql-key">Ctrl</code>
    );

  return (
    <div data-testid="graphiql-container" className="graphiql-container">
      <div className="graphiql-sidebar">
        <div>
          {explorerContext ? (
            <Tooltip
              label={
                explorerContext.isVisible
                  ? 'Hide Documentation Explorer'
                  : 'Show Documentation Explorer'
              }>
              <UnStyledButton
                className={explorerContext.isVisible ? 'active' : ''}
                onClick={() => {
                  if (explorerContext?.isVisible) {
                    explorerContext?.hide();
                    pluginResize.setHiddenElement('first');
                  } else {
                    explorerContext?.show();
                    pluginResize.setHiddenElement(null);
                    if (historyContext?.isVisible) {
                      historyContext.hide();
                    }
                  }
                }}
                aria-label={
                  explorerContext.isVisible
                    ? 'Hide Documentation Explorer'
                    : 'Show Documentation Explorer'
                }>
                <DocsIcon aria-hidden="true" />
              </UnStyledButton>
            </Tooltip>
          ) : null}
          {historyContext ? (
            <Tooltip
              label={
                historyContext.isVisible ? 'Hide History' : 'Show History'
              }>
              <UnStyledButton
                className={historyContext.isVisible ? 'active' : ''}
                onClick={() => {
                  if (!historyContext) {
                    return;
                  }
                  historyContext.toggle();
                  if (historyContext.isVisible) {
                    pluginResize.setHiddenElement('first');
                  } else {
                    pluginResize.setHiddenElement(null);
                    if (explorerContext?.isVisible) {
                      explorerContext.hide();
                    }
                  }
                }}
                aria-label={
                  historyContext.isVisible ? 'Hide History' : 'Show History'
                }>
                <HistoryIcon aria-hidden="true" />
              </UnStyledButton>
            </Tooltip>
          ) : null}
        </div>
        <div>
          <Tooltip label="Re-fetch GraphQL schema">
            <UnStyledButton
              disabled={schemaContext.isFetching}
              onClick={() => schemaContext.introspect()}
              aria-label="Re-fetch GraphQL schema">
              <ReloadIcon
                className={schemaContext.isFetching ? 'graphiql-spin' : ''}
                aria-hidden="true"
              />
            </UnStyledButton>
          </Tooltip>
          <Tooltip label="Open short keys dialog">
            <UnStyledButton
              onClick={() => setShowDialog('short-keys')}
              aria-label="Open short keys dialog">
              <KeyboardShortcutIcon aria-hidden="true" />
            </UnStyledButton>
          </Tooltip>
          <Tooltip label="Open settings dialog">
            <UnStyledButton
              onClick={() => setShowDialog('settings')}
              aria-label="Open settings dialog">
              <SettingsIcon aria-hidden="true" />
            </UnStyledButton>
          </Tooltip>
        </div>
      </div>
      <div className="graphiql-main">
        <div
          ref={pluginResize.firstRef}
          style={{
            // Make sure the container shrinks when containing long
            // non-breaking texts
            minWidth: '200px',
          }}>
          <div className="graphiql-plugin">
            {explorerContext?.isVisible ? <DocExplorer /> : null}
            {historyContext?.isVisible ? <History /> : null}
          </div>
        </div>
        <div ref={pluginResize.dragBarRef}>
          {explorerContext?.isVisible || historyContext?.isVisible ? (
            <div className="graphiql-horizontal-drag-bar" />
          ) : null}
        </div>
        <div ref={pluginResize.secondRef}>
          <div className="graphiql-sessions">
            <div className="graphiql-session-header">
              <Tabs aria-label="Select active operation">
                {editorContext.tabs.length > 1 ? (
                  <>
                    {editorContext.tabs.map((tab, index) => (
                      <Tab
                        key={tab.id}
                        isActive={index === editorContext.activeTabIndex}>
                        <Tab.Button
                          aria-controls="graphiql-session"
                          id={`graphiql-session-tab-${index}`}
                          onClick={() => {
                            executionContext.stop();
                            editorContext.changeTab(index);
                          }}>
                          {tab.title}
                        </Tab.Button>
                        <Tab.Close
                          onClick={() => {
                            if (editorContext.activeTabIndex === index) {
                              executionContext.stop();
                            }
                            editorContext.closeTab(index);
                          }}
                        />
                      </Tab>
                    ))}
                    <Tooltip label="Add tab">
                      <UnStyledButton
                        className="graphiql-tab-add"
                        onClick={() => editorContext.addTab()}
                        aria-label="Add tab">
                        <PlusIcon aria-hidden="true" />
                      </UnStyledButton>
                    </Tooltip>
                  </>
                ) : null}
              </Tabs>
              <div className="graphiql-session-header-right">
                {editorContext.tabs.length === 1 ? (
                  <Tooltip label="Add tab">
                    <UnStyledButton
                      className="graphiql-tab-add"
                      onClick={() => editorContext.addTab()}
                      aria-label="Add tab">
                      <PlusIcon aria-hidden="true" />
                    </UnStyledButton>
                  </Tooltip>
                ) : null}
                <div className="graphiql-logo">{logo}</div>
              </div>
            </div>
            <div
              role="tabpanel"
              id="graphiql-session"
              className="graphiql-session"
              aria-labelledby={`graphiql-session-tab-${editorContext.activeTabIndex}`}>
              <div ref={editorResize.firstRef}>
                <div
                  className={`graphiql-editors${
                    editorContext.tabs.length === 1 ? ' full-height' : ''
                  }`}>
                  <div ref={editorToolsResize.firstRef}>
                    <section
                      className="graphiql-query-editor"
                      aria-label="Query Editor">
                      <div className="graphiql-query-editor-wrapper">
                        <QueryEditor
                          editorTheme={props.editorTheme}
                          keyMap={props.keyMap}
                          onClickReference={onClickReference}
                          onCopyQuery={props.onCopyQuery}
                          onEdit={props.onEditQuery}
                          onEditOperationName={props.onEditOperationName}
                          readOnly={props.readOnly}
                        />
                      </div>
                      <div
                        className="graphiql-toolbar"
                        role="toolbar"
                        aria-label="Editor Commands">
                        <ExecuteButton />
                        {toolbar}
                      </div>
                    </section>
                  </div>
                  <div ref={editorToolsResize.dragBarRef}>
                    <div className="graphiql-editor-tools">
                      <div className="graphiql-editor-tools-tabs">
                        <UnStyledButton
                          className={
                            activeSecondaryEditor === 'variable' ? 'active' : ''
                          }
                          onClick={() => {
                            if (editorToolsResize.hiddenElement === 'second') {
                              editorToolsResize.setHiddenElement(null);
                            }
                            setActiveSecondaryEditor('variable');
                          }}>
                          Variables
                        </UnStyledButton>
                        {headerEditorEnabled ? (
                          <UnStyledButton
                            className={
                              activeSecondaryEditor === 'header' ? 'active' : ''
                            }
                            onClick={() => {
                              if (
                                editorToolsResize.hiddenElement === 'second'
                              ) {
                                editorToolsResize.setHiddenElement(null);
                              }
                              setActiveSecondaryEditor('header');
                            }}>
                            Headers
                          </UnStyledButton>
                        ) : null}
                      </div>
                      <Tooltip
                        label={
                          editorToolsResize.hiddenElement === 'second'
                            ? 'Show editor tools'
                            : 'Hide editor tools'
                        }>
                        <UnStyledButton
                          onClick={() => {
                            editorToolsResize.setHiddenElement(
                              editorToolsResize.hiddenElement === 'second'
                                ? null
                                : 'second',
                            );
                          }}
                          aria-label={
                            editorToolsResize.hiddenElement === 'second'
                              ? 'Show editor tools'
                              : 'Hide editor tools'
                          }>
                          {editorToolsResize.hiddenElement === 'second' ? (
                            <ChevronUpIcon
                              className="graphiql-chevron-icon"
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronDownIcon
                              className="graphiql-chevron-icon"
                              aria-hidden="true"
                            />
                          )}
                        </UnStyledButton>
                      </Tooltip>
                    </div>
                  </div>
                  <div ref={editorToolsResize.secondRef}>
                    <section
                      className="graphiql-editor-tool"
                      aria-label={
                        activeSecondaryEditor === 'variable'
                          ? 'Variables'
                          : 'Headers'
                      }>
                      <VariableEditor
                        editorTheme={props.editorTheme}
                        isHidden={activeSecondaryEditor !== 'variable'}
                        keyMap={props.keyMap}
                        onEdit={props.onEditVariables}
                        onClickReference={onClickReference}
                        readOnly={props.readOnly}
                      />
                      {headerEditorEnabled && (
                        <HeaderEditor
                          editorTheme={props.editorTheme}
                          isHidden={activeSecondaryEditor !== 'header'}
                          keyMap={props.keyMap}
                          onEdit={props.onEditHeaders}
                          readOnly={props.readOnly}
                        />
                      )}
                    </section>
                  </div>
                </div>
              </div>
              <div ref={editorResize.dragBarRef}>
                <div className="graphiql-horizontal-drag-bar" />
              </div>
              <div ref={editorResize.secondRef}>
                <div className="graphiql-response">
                  {executionContext.isFetching ? <Spinner /> : null}
                  <ResponseEditor
                    value={props.response}
                    editorTheme={props.editorTheme}
                    ResponseTooltip={props.ResultsTooltip}
                    keyMap={props.keyMap}
                  />
                  {footer}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog
        isOpen={showDialog === 'short-keys'}
        onDismiss={() => setShowDialog(null)}>
        <div className="graphiql-dialog-header">
          <div className="graphiql-dialog-title">Short Keys</div>
          <Dialog.Close onClick={() => setShowDialog(null)} />
        </div>
        <div className="graphiql-dialog-section">
          <div>
            <table className="graphiql-table">
              <thead>
                <tr>
                  <th>Short key</th>
                  <th>Function</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {modifier}
                    {' + '}
                    <code className="graphiql-key">F</code>
                  </td>
                  <td>Search in editor</td>
                </tr>
                <tr>
                  <td>
                    {modifier}
                    {' + '}
                    <code className="graphiql-key">K</code>
                  </td>
                  <td>Search in documentation</td>
                </tr>
                <tr>
                  <td>
                    {modifier}
                    {' + '}
                    <code className="graphiql-key">Enter</code>
                  </td>
                  <td>Execute query</td>
                </tr>
                <tr>
                  <td>
                    <code className="graphiql-key">Ctrl</code>
                    {' + '}
                    <code className="graphiql-key">Shift</code>
                    {' + '}
                    <code className="graphiql-key">P</code>
                  </td>
                  <td>Prettify editors</td>
                </tr>
                <tr>
                  <td>
                    <code className="graphiql-key">Ctrl</code>
                    {' + '}
                    <code className="graphiql-key">Shift</code>
                    {' + '}
                    <code className="graphiql-key">M</code>
                  </td>
                  <td>Merge fragments definitions into operation definition</td>
                </tr>
                <tr>
                  <td>
                    <code className="graphiql-key">Ctrl</code>
                    {' + '}
                    <code className="graphiql-key">Shift</code>
                    {' + '}
                    <code className="graphiql-key">C</code>
                  </td>
                  <td>Copy query</td>
                </tr>
                <tr>
                  <td>
                    <code className="graphiql-key">Ctrl</code>
                    {' + '}
                    <code className="graphiql-key">Shift</code>
                    {' + '}
                    <code className="graphiql-key">R</code>
                  </td>
                  <td>Re-fetch schema using introspection</td>
                </tr>
              </tbody>
            </table>
            <p>
              The editors use{' '}
              <a
                href="https://codemirror.net/5/doc/manual.html#keymaps"
                target="_blank"
                rel="noopener noreferrer">
                CodeMirror Key Maps
              </a>{' '}
              that add more short keys. This instance of Graph<em>i</em>QL uses{' '}
              <code>{props.keyMap || 'sublime'}</code>.
            </p>
          </div>
        </div>
      </Dialog>
      <Dialog
        isOpen={showDialog === 'settings'}
        onDismiss={() => {
          setShowDialog(null);
          setClearStorageStatus(null);
        }}>
        <div className="graphiql-dialog-header">
          <div className="graphiql-dialog-title">Settings</div>
          <Dialog.Close
            onClick={() => {
              setShowDialog(null);
              setClearStorageStatus(null);
            }}
          />
        </div>
        <div className="graphiql-dialog-section">
          <div>
            <div className="graphiql-dialog-section-title">Theme</div>
            <div className="graphiql-dialog-section-caption">
              Adjust how the interface looks like.
            </div>
          </div>
          <div>
            <ButtonGroup>
              <Button
                className={theme === null ? 'active' : ''}
                onClick={() => setTheme(null)}>
                System
              </Button>
              <Button
                className={theme === 'light' ? 'active' : ''}
                onClick={() => setTheme('light')}>
                Light
              </Button>
              <Button
                className={theme === 'dark' ? 'active' : ''}
                onClick={() => setTheme('dark')}>
                Dark
              </Button>
            </ButtonGroup>
          </div>
        </div>
        {storageContext ? (
          <div className="graphiql-dialog-section">
            <div>
              <div className="graphiql-dialog-section-title">Clear storage</div>
              <div className="graphiql-dialog-section-caption">
                Remove all locally stored data and start fresh.
              </div>
            </div>
            <div>
              <Button
                state={clearStorageStatus || undefined}
                disabled={clearStorageStatus === 'success'}
                onClick={() => {
                  try {
                    storageContext?.clear();
                    setClearStorageStatus('success');
                  } catch {
                    setClearStorageStatus('error');
                  }
                }}>
                {clearStorageStatus === 'success'
                  ? 'Cleared data'
                  : clearStorageStatus === 'error'
                  ? 'Failed'
                  : 'Clear data'}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

// Configure the UI by providing this Component as a child of GraphiQL.
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
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
}

GraphiQLToolbar.displayName = 'GraphiQLToolbar';

// Configure the UI by providing this Component as a child of GraphiQL.
function GraphiQLFooter<TProps>(props: PropsWithChildren<TProps>) {
  return <div className="graphiql-footer">{props.children}</div>;
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
