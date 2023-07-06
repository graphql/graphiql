/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, {
  ComponentType,
  Fragment,
  MouseEventHandler,
  PropsWithChildren,
  ReactNode,
  ReactElement,
  useCallback,
  useState,
} from 'react';

import {
  Button,
  ButtonGroup,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  Dialog,
  ExecuteButton,
  GraphiQLProvider,
  GraphiQLProviderProps,
  HeaderEditor,
  KeyboardShortcutIcon,
  MergeIcon,
  PlusIcon,
  PrettifyIcon,
  QueryEditor,
  ReloadIcon,
  ResponseEditor,
  SettingsIcon,
  Spinner,
  Tab,
  Tabs,
  ToolbarButton,
  Tooltip,
  UnStyledButton,
  useCopyQuery,
  useDragResize,
  useEditorContext,
  useExecutionContext,
  UseHeaderEditorArgs,
  useMergeQuery,
  usePluginContext,
  usePrettifyEditors,
  UseQueryEditorArgs,
  UseResponseEditorArgs,
  useSchemaContext,
  useStorageContext,
  useTheme,
  UseVariableEditorArgs,
  VariableEditor,
  WriteableEditorProps,
} from '@graphiql/react';

const majorVersion = parseInt(React.version.slice(0, 2), 10);

if (majorVersion < 16) {
  throw new Error(
    [
      'GraphiQL 0.18.0 and after is not compatible with React 15 or below.',
      'If you are using a CDN source (jsdelivr, unpkg, etc), follow this example:',
      'https://github.com/graphql/graphiql/blob/master/examples/graphiql-cdn/index.html#L49',
    ].join('\n'),
  );
}

export type GraphiQLToolbarConfig = {
  /**
   * This content will be rendered after the built-in buttons of the toolbar.
   * Note that this will not apply if you provide a completely custom toolbar
   * (by passing `GraphiQL.Toolbar` as child to the `GraphiQL` component).
   */
  additionalContent?: React.ReactNode;
};

/**
 * API docs for this live here:
 *
 * https://graphiql-test.netlify.app/typedoc/modules/graphiql.html#graphiqlprops
 */
export type GraphiQLProps = Omit<GraphiQLProviderProps, 'children'> &
  GraphiQLInterfaceProps;

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */

export function GraphiQL({
  dangerouslyAssumeSchemaIsValid,
  defaultQuery,
  defaultTabs,
  externalFragments,
  fetcher,
  getDefaultFieldNames,
  headers,
  inputValueDeprecation,
  introspectionQueryName,
  maxHistoryLength,
  onEditOperationName,
  onSchemaChange,
  onTabChange,
  onTogglePluginVisibility,
  operationName,
  plugins,
  query,
  response,
  schema,
  schemaDescription,
  shouldPersistHeaders,
  storage,
  validationRules,
  variables,
  visiblePlugin,
  defaultHeaders,
  ...props
}: GraphiQLProps) {
  // Ensure props are correct
  if (typeof fetcher !== 'function') {
    throw new TypeError(
      'The `GraphiQL` component requires a `fetcher` function to be passed as prop.',
    );
  }

  return (
    <GraphiQLProvider
      getDefaultFieldNames={getDefaultFieldNames}
      dangerouslyAssumeSchemaIsValid={dangerouslyAssumeSchemaIsValid}
      defaultQuery={defaultQuery}
      defaultHeaders={defaultHeaders}
      defaultTabs={defaultTabs}
      externalFragments={externalFragments}
      fetcher={fetcher}
      headers={headers}
      inputValueDeprecation={inputValueDeprecation}
      introspectionQueryName={introspectionQueryName}
      maxHistoryLength={maxHistoryLength}
      onEditOperationName={onEditOperationName}
      onSchemaChange={onSchemaChange}
      onTabChange={onTabChange}
      onTogglePluginVisibility={onTogglePluginVisibility}
      plugins={plugins}
      visiblePlugin={visiblePlugin}
      operationName={operationName}
      query={query}
      response={response}
      schema={schema}
      schemaDescription={schemaDescription}
      shouldPersistHeaders={shouldPersistHeaders}
      storage={storage}
      validationRules={validationRules}
      variables={variables}
    >
      <GraphiQLInterface
        showPersistHeadersSettings={shouldPersistHeaders !== false}
        {...props}
      />
    </GraphiQLProvider>
  );
}

// Export main windows/panes to be used separately if desired.
GraphiQL.Logo = GraphiQLLogo;
GraphiQL.Toolbar = GraphiQLToolbar;
GraphiQL.Footer = GraphiQLFooter;

type AddSuffix<Obj extends Record<string, any>, Suffix extends string> = {
  [Key in keyof Obj as `${string & Key}${Suffix}`]: Obj[Key];
};

export type GraphiQLInterfaceProps = WriteableEditorProps &
  AddSuffix<Pick<UseQueryEditorArgs, 'onEdit'>, 'Query'> &
  Pick<UseQueryEditorArgs, 'onCopyQuery'> &
  AddSuffix<Pick<UseVariableEditorArgs, 'onEdit'>, 'Variables'> &
  AddSuffix<Pick<UseHeaderEditorArgs, 'onEdit'>, 'Headers'> &
  Pick<UseResponseEditorArgs, 'responseTooltip'> & {
    children?: ReactNode;
    /**
     * Set the default state for the editor tools.
     * - `false` hides the editor tools
     * - `true` shows the editor tools
     * - `'variables'` specifically shows the variables editor
     * - `'headers'` specifically shows the headers editor
     * By default the editor tools are initially shown when at least one of the
     * editors has contents.
     */
    defaultEditorToolsVisibility?: boolean | 'variables' | 'headers';
    /**
     * Toggle if the headers editor should be shown inside the editor tools.
     * @default true
     */
    isHeadersEditorEnabled?: boolean;
    /**
     * An object that allows configuration of the toolbar next to the query
     * editor.
     */
    toolbar?: GraphiQLToolbarConfig;
    /**
     * Indicates if settings for persisting headers should appear in the
     * settings modal.
     */
    showPersistHeadersSettings?: boolean;
  };

export function GraphiQLInterface(props: GraphiQLInterfaceProps) {
  const isHeadersEditorEnabled = props.isHeadersEditorEnabled ?? true;
  const editorContext = useEditorContext({ nonNull: true });
  const executionContext = useExecutionContext({ nonNull: true });
  const schemaContext = useSchemaContext({ nonNull: true });
  const storageContext = useStorageContext();
  const pluginContext = usePluginContext();

  const copy = useCopyQuery({ onCopyQuery: props.onCopyQuery });
  const merge = useMergeQuery();
  const prettify = usePrettifyEditors();

  const { theme, setTheme } = useTheme();

  const PluginContent = pluginContext?.visiblePlugin?.content;

  const pluginResize = useDragResize({
    defaultSizeRelation: 1 / 3,
    direction: 'horizontal',
    initiallyHidden: pluginContext?.visiblePlugin ? undefined : 'first',
    onHiddenElementChange(resizableElement) {
      if (resizableElement === 'first') {
        pluginContext?.setVisiblePlugin(null);
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
      if (
        props.defaultEditorToolsVisibility === 'variables' ||
        props.defaultEditorToolsVisibility === 'headers'
      ) {
        return;
      }

      if (typeof props.defaultEditorToolsVisibility === 'boolean') {
        return props.defaultEditorToolsVisibility ? undefined : 'second';
      }

      return editorContext.initialVariables || editorContext.initialHeaders
        ? undefined
        : 'second';
    })(),
    sizeThresholdSecond: 60,
    storageKey: 'secondaryEditorFlex',
  });

  const [activeSecondaryEditor, setActiveSecondaryEditor] = useState<
    'variables' | 'headers'
  >(() => {
    if (
      props.defaultEditorToolsVisibility === 'variables' ||
      props.defaultEditorToolsVisibility === 'headers'
    ) {
      return props.defaultEditorToolsVisibility;
    }
    return !editorContext.initialVariables &&
      editorContext.initialHeaders &&
      isHeadersEditorEnabled
      ? 'headers'
      : 'variables';
  });
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
      <ToolbarButton onClick={prettify} label="Prettify query (Shift-Ctrl-P)">
        <PrettifyIcon className="graphiql-toolbar-icon" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={merge}
        label="Merge fragments into query (Shift-Ctrl-M)"
      >
        <MergeIcon className="graphiql-toolbar-icon" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton onClick={copy} label="Copy query (Shift-Ctrl-C)">
        <CopyIcon className="graphiql-toolbar-icon" aria-hidden="true" />
      </ToolbarButton>
      {props.toolbar?.additionalContent}
    </>
  );

  const footer = children.find(child =>
    isChildComponentType(child, GraphiQL.Footer),
  );

  const onClickReference = useCallback(() => {
    if (pluginResize.hiddenElement === 'first') {
      pluginResize.setHiddenElement(null);
    }
  }, [pluginResize]);

  const handleClearData = useCallback(() => {
    try {
      storageContext?.clear();
      setClearStorageStatus('success');
    } catch {
      setClearStorageStatus('error');
    }
  }, [storageContext]);

  const handlePersistHeaders: MouseEventHandler<HTMLButtonElement> =
    useCallback(
      event => {
        editorContext.setShouldPersistHeaders(
          event.currentTarget.dataset.value === 'true',
        );
      },
      [editorContext],
    );

  const handleChangeTheme: MouseEventHandler<HTMLButtonElement> = useCallback(
    event => {
      const selectedTheme = event.currentTarget.dataset.theme as
        | 'light'
        | 'dark'
        | undefined;
      setTheme(selectedTheme || null);
    },
    [setTheme],
  );

  const handleAddTab = editorContext.addTab;
  const handleRefetchSchema = schemaContext.introspect;
  const handleReorder = editorContext.moveTab;

  const handleShowDialog: MouseEventHandler<HTMLButtonElement> = useCallback(
    event => {
      setShowDialog(
        event.currentTarget.dataset.value as 'short-keys' | 'settings',
      );
    },
    [],
  );

  const handlePluginClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    e => {
      const context = pluginContext!;
      const pluginIndex = Number(e.currentTarget.dataset.index!);
      const plugin = context.plugins.find((_, index) => pluginIndex === index)!;
      const isVisible = plugin === context.visiblePlugin;
      if (isVisible) {
        context.setVisiblePlugin(null);
        pluginResize.setHiddenElement('first');
      } else {
        context.setVisiblePlugin(plugin);
        pluginResize.setHiddenElement(null);
      }
    },
    [pluginContext, pluginResize],
  );

  const handleToolsTabClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    event => {
      if (editorToolsResize.hiddenElement === 'second') {
        editorToolsResize.setHiddenElement(null);
      }
      setActiveSecondaryEditor(
        event.currentTarget.dataset.name as 'variables' | 'headers',
      );
    },
    [editorToolsResize],
  );

  const toggleEditorTools: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      editorToolsResize.setHiddenElement(
        editorToolsResize.hiddenElement === 'second' ? null : 'second',
      );
    }, [editorToolsResize]);

  const handleOpenShortKeysDialog = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setShowDialog(null);
    }
  }, []);

  const handleOpenSettingsDialog = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setShowDialog(null);
      setClearStorageStatus(null);
    }
  }, []);

  const addTab = (
    <Tooltip label="Add tab">
      <UnStyledButton
        type="button"
        className="graphiql-tab-add"
        onClick={handleAddTab}
        aria-label="Add tab"
      >
        <PlusIcon aria-hidden="true" />
      </UnStyledButton>
    </Tooltip>
  );

  return (
    <Tooltip.Provider>
      <div data-testid="graphiql-container" className="graphiql-container">
        <div className="graphiql-sidebar">
          <div className="graphiql-sidebar-section">
            {pluginContext?.plugins.map((plugin, index) => {
              const isVisible = plugin === pluginContext.visiblePlugin;
              const label = `${isVisible ? 'Hide' : 'Show'} ${plugin.title}`;
              const Icon = plugin.icon;
              return (
                <Tooltip key={plugin.title} label={label}>
                  <UnStyledButton
                    type="button"
                    className={isVisible ? 'active' : ''}
                    onClick={handlePluginClick}
                    data-index={index}
                    aria-label={label}
                  >
                    <Icon aria-hidden="true" />
                  </UnStyledButton>
                </Tooltip>
              );
            })}
          </div>
          <div className="graphiql-sidebar-section">
            <Tooltip label="Re-fetch GraphQL schema">
              <UnStyledButton
                type="button"
                disabled={schemaContext.isFetching}
                onClick={handleRefetchSchema}
                aria-label="Re-fetch GraphQL schema"
              >
                <ReloadIcon
                  className={schemaContext.isFetching ? 'graphiql-spin' : ''}
                  aria-hidden="true"
                />
              </UnStyledButton>
            </Tooltip>
            <Tooltip label="Open short keys dialog">
              <UnStyledButton
                type="button"
                data-value="short-keys"
                onClick={handleShowDialog}
                aria-label="Open short keys dialog"
              >
                <KeyboardShortcutIcon aria-hidden="true" />
              </UnStyledButton>
            </Tooltip>
            <Tooltip label="Open settings dialog">
              <UnStyledButton
                type="button"
                data-value="settings"
                onClick={handleShowDialog}
                aria-label="Open settings dialog"
              >
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
            }}
          >
            <div className="graphiql-plugin">
              {PluginContent ? <PluginContent /> : null}
            </div>
          </div>
          {pluginContext?.visiblePlugin && (
            <div
              className="graphiql-horizontal-drag-bar"
              ref={pluginResize.dragBarRef}
            />
          )}
          <div ref={pluginResize.secondRef} className="graphiql-sessions">
            <div className="graphiql-session-header">
              <Tabs
                values={editorContext.tabs}
                onReorder={handleReorder}
                aria-label="Select active operation"
              >
                {editorContext.tabs.length > 1 && (
                  <>
                    {editorContext.tabs.map((tab, index) => (
                      <Tab
                        key={tab.id}
                        value={tab}
                        isActive={index === editorContext.activeTabIndex}
                      >
                        <Tab.Button
                          aria-controls="graphiql-session"
                          id={`graphiql-session-tab-${index}`}
                          onClick={() => {
                            executionContext.stop();
                            editorContext.changeTab(index);
                          }}
                        >
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
                    {addTab}
                  </>
                )}
              </Tabs>
              <div className="graphiql-session-header-right">
                {editorContext.tabs.length === 1 && addTab}
                {logo}
              </div>
            </div>
            <div
              role="tabpanel"
              id="graphiql-session"
              className="graphiql-session"
              aria-labelledby={`graphiql-session-tab-${editorContext.activeTabIndex}`}
            >
              <div ref={editorResize.firstRef}>
                <div
                  className={`graphiql-editors${
                    editorContext.tabs.length === 1 ? ' full-height' : ''
                  }`}
                >
                  <div ref={editorToolsResize.firstRef}>
                    <section
                      className="graphiql-query-editor"
                      aria-label="Query Editor"
                    >
                      <QueryEditor
                        editorTheme={props.editorTheme}
                        keyMap={props.keyMap}
                        onClickReference={onClickReference}
                        onCopyQuery={props.onCopyQuery}
                        onEdit={props.onEditQuery}
                        readOnly={props.readOnly}
                      />
                      <div
                        className="graphiql-toolbar"
                        role="toolbar"
                        aria-label="Editor Commands"
                      >
                        <ExecuteButton />
                        {toolbar}
                      </div>
                    </section>
                  </div>

                  <div ref={editorToolsResize.dragBarRef}>
                    <div className="graphiql-editor-tools">
                      <UnStyledButton
                        type="button"
                        className={
                          activeSecondaryEditor === 'variables' &&
                          editorToolsResize.hiddenElement !== 'second'
                            ? 'active'
                            : ''
                        }
                        onClick={handleToolsTabClick}
                        data-name="variables"
                      >
                        Variables
                      </UnStyledButton>
                      {isHeadersEditorEnabled && (
                        <UnStyledButton
                          type="button"
                          className={
                            activeSecondaryEditor === 'headers' &&
                            editorToolsResize.hiddenElement !== 'second'
                              ? 'active'
                              : ''
                          }
                          onClick={handleToolsTabClick}
                          data-name="headers"
                        >
                          Headers
                        </UnStyledButton>
                      )}

                      <Tooltip
                        label={
                          editorToolsResize.hiddenElement === 'second'
                            ? 'Show editor tools'
                            : 'Hide editor tools'
                        }
                      >
                        <UnStyledButton
                          type="button"
                          onClick={toggleEditorTools}
                          aria-label={
                            editorToolsResize.hiddenElement === 'second'
                              ? 'Show editor tools'
                              : 'Hide editor tools'
                          }
                          className="graphiql-toggle-editor-tools"
                        >
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
                        activeSecondaryEditor === 'variables'
                          ? 'Variables'
                          : 'Headers'
                      }
                    >
                      <VariableEditor
                        editorTheme={props.editorTheme}
                        isHidden={activeSecondaryEditor !== 'variables'}
                        keyMap={props.keyMap}
                        onEdit={props.onEditVariables}
                        onClickReference={onClickReference}
                        readOnly={props.readOnly}
                      />
                      {isHeadersEditorEnabled && (
                        <HeaderEditor
                          editorTheme={props.editorTheme}
                          isHidden={activeSecondaryEditor !== 'headers'}
                          keyMap={props.keyMap}
                          onEdit={props.onEditHeaders}
                          readOnly={props.readOnly}
                        />
                      )}
                    </section>
                  </div>
                </div>
              </div>

              <div
                className="graphiql-horizontal-drag-bar"
                ref={editorResize.dragBarRef}
              />

              <div ref={editorResize.secondRef}>
                <div className="graphiql-response">
                  {executionContext.isFetching ? <Spinner /> : null}
                  <ResponseEditor
                    editorTheme={props.editorTheme}
                    responseTooltip={props.responseTooltip}
                    keyMap={props.keyMap}
                  />
                  {footer}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Dialog
          open={showDialog === 'short-keys'}
          onOpenChange={handleOpenShortKeysDialog}
        >
          <div className="graphiql-dialog-header">
            <Dialog.Title className="graphiql-dialog-title">
              Short Keys
            </Dialog.Title>
            <Dialog.Close />
          </div>
          <div className="graphiql-dialog-section">
            <ShortKeys keyMap={props.keyMap || 'sublime'} />
          </div>
        </Dialog>
        <Dialog
          open={showDialog === 'settings'}
          onOpenChange={handleOpenSettingsDialog}
        >
          <div className="graphiql-dialog-header">
            <Dialog.Title className="graphiql-dialog-title">
              Settings
            </Dialog.Title>
            <Dialog.Close />
          </div>
          {props.showPersistHeadersSettings ? (
            <div className="graphiql-dialog-section">
              <div>
                <div className="graphiql-dialog-section-title">
                  Persist headers
                </div>
                <div className="graphiql-dialog-section-caption">
                  Save headers upon reloading.{' '}
                  <span className="graphiql-warning-text">
                    Only enable if you trust this device.
                  </span>
                </div>
              </div>
              <ButtonGroup>
                <Button
                  type="button"
                  id="enable-persist-headers"
                  className={editorContext.shouldPersistHeaders ? 'active' : ''}
                  data-value="true"
                  onClick={handlePersistHeaders}
                >
                  On
                </Button>
                <Button
                  type="button"
                  id="disable-persist-headers"
                  className={editorContext.shouldPersistHeaders ? '' : 'active'}
                  onClick={handlePersistHeaders}
                >
                  Off
                </Button>
              </ButtonGroup>
            </div>
          ) : null}
          <div className="graphiql-dialog-section">
            <div>
              <div className="graphiql-dialog-section-title">Theme</div>
              <div className="graphiql-dialog-section-caption">
                Adjust how the interface looks like.
              </div>
            </div>
            <ButtonGroup>
              <Button
                type="button"
                className={theme === null ? 'active' : ''}
                onClick={handleChangeTheme}
              >
                System
              </Button>
              <Button
                type="button"
                className={theme === 'light' ? 'active' : ''}
                data-theme="light"
                onClick={handleChangeTheme}
              >
                Light
              </Button>
              <Button
                type="button"
                className={theme === 'dark' ? 'active' : ''}
                data-theme="dark"
                onClick={handleChangeTheme}
              >
                Dark
              </Button>
            </ButtonGroup>
          </div>
          {storageContext ? (
            <div className="graphiql-dialog-section">
              <div>
                <div className="graphiql-dialog-section-title">
                  Clear storage
                </div>
                <div className="graphiql-dialog-section-caption">
                  Remove all locally stored data and start fresh.
                </div>
              </div>
              <Button
                type="button"
                state={clearStorageStatus || undefined}
                disabled={clearStorageStatus === 'success'}
                onClick={handleClearData}
              >
                {{
                  success: 'Cleared data',
                  error: 'Failed',
                }[clearStorageStatus!] || 'Clear data'}
              </Button>
            </div>
          ) : null}
        </Dialog>
      </div>
    </Tooltip.Provider>
  );
}

const modifier =
  typeof window !== 'undefined' &&
  window.navigator.platform.toLowerCase().indexOf('mac') === 0
    ? 'Cmd'
    : 'Ctrl';

const SHORT_KEYS = Object.entries({
  'Search in editor': [modifier, 'F'],
  'Search in documentation': [modifier, 'K'],
  'Execute query': [modifier, 'Enter'],
  'Prettify editors': ['Ctrl', 'Shift', 'P'],
  'Merge fragments definitions into operation definition': [
    'Ctrl',
    'Shift',
    'M',
  ],
  'Copy query': ['Ctrl', 'Shift', 'C'],
  'Re-fetch schema using introspection': ['Ctrl', 'Shift', 'R'],
});

function ShortKeys({ keyMap }: { keyMap: string }): ReactElement {
  return (
    <div>
      <table className="graphiql-table">
        <thead>
          <tr>
            <th>Short Key</th>
            <th>Function</th>
          </tr>
        </thead>
        <tbody>
          {SHORT_KEYS.map(([title, keys]) => (
            <tr key={title}>
              <td>
                {keys.map((key, index, array) => (
                  <Fragment key={key}>
                    <code className="graphiql-key">{key}</code>
                    {index !== array.length - 1 && ' + '}
                  </Fragment>
                ))}
              </td>
              <td>{title}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        The editors use{' '}
        <a
          href="https://codemirror.net/5/doc/manual.html#keymaps"
          target="_blank"
          rel="noopener noreferrer"
        >
          CodeMirror Key Maps
        </a>{' '}
        that add more short keys. This instance of Graph<em>i</em>QL uses{' '}
        <code>{keyMap}</code>.
      </p>
    </div>
  );
}

// Configure the UI by providing this Component as a child of GraphiQL.
function GraphiQLLogo<TProps>(props: PropsWithChildren<TProps>) {
  return (
    <div className="graphiql-logo">
      {props.children || (
        <a
          className="graphiql-logo-link"
          href="https://github.com/graphql/graphiql"
          target="_blank"
          rel="noreferrer"
        >
          Graph
          <em>i</em>
          QL
        </a>
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
