/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import type {
  MouseEventHandler,
  ReactNode,
  FC,
  ComponentPropsWithoutRef,
} from 'react';
import { Fragment, useState, useEffect, Children, cloneElement } from 'react';
import {
  Button,
  ButtonGroup,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  Dialog,
  ExecuteButton,
  GraphiQLProvider,
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
  Theme,
  ToolbarButton,
  Tooltip,
  UnStyledButton,
  useCopyQuery,
  useDragResize,
  useEditorContext,
  useExecutionContext,
  UseHeaderEditorArgs,
  useMergeQuery,
  usePluginStore,
  usePrettifyEditors,
  UseQueryEditorArgs,
  UseResponseEditorArgs,
  useSchemaStore,
  useStorage,
  useTheme,
  UseVariableEditorArgs,
  VariableEditor,
  WriteableEditorProps,
  isMacOs,
  cn,
} from '@graphiql/react';
import {
  HistoryContextProvider,
  HISTORY_PLUGIN,
} from '@graphiql/plugin-history';
import {
  DocExplorerContextProvider,
  DOC_EXPLORER_PLUGIN,
} from '@graphiql/plugin-doc-explorer';

/**
 * API docs for this live here:
 *
 * https://graphiql-test.netlify.app/typedoc/modules/graphiql.html#graphiqlprops
 */
export type GraphiQLProps =
  //
  Omit<ComponentPropsWithoutRef<typeof GraphiQLProvider>, 'children'> &
    Omit<ComponentPropsWithoutRef<typeof HistoryContextProvider>, 'children'> &
    // `children` prop should be optional
    GraphiQLInterfaceProps;

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */
const GraphiQL_: FC<GraphiQLProps> = ({
  dangerouslyAssumeSchemaIsValid,
  confirmCloseTab,
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
  plugins = [],
  referencePlugin = DOC_EXPLORER_PLUGIN,
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
}) => {
  // @ts-expect-error -- Prop is removed
  if (props.toolbar?.additionalContent) {
    throw new TypeError(
      '`toolbar.additionalContent` was removed. Use render props on `GraphiQL.Toolbar` component instead.',
    );
  }
  // @ts-expect-error -- Prop is removed
  if (props.toolbar?.additionalComponent) {
    throw new TypeError(
      '`toolbar.additionalComponent` was removed. Use render props on `GraphiQL.Toolbar` component instead.',
    );
  }
  const graphiqlProps = {
    getDefaultFieldNames,
    dangerouslyAssumeSchemaIsValid,
    defaultQuery,
    defaultHeaders,
    defaultTabs,
    externalFragments,
    fetcher,
    headers,
    inputValueDeprecation,
    introspectionQueryName,
    onEditOperationName,
    onSchemaChange,
    onTabChange,
    onTogglePluginVisibility,
    plugins: [referencePlugin, HISTORY_PLUGIN, ...plugins],
    referencePlugin,
    visiblePlugin,
    operationName,
    query,
    response,
    schema,
    schemaDescription,
    shouldPersistHeaders,
    storage,
    validationRules,
    variables,
  };
  return (
    <GraphiQLProvider {...graphiqlProps}>
      <HistoryContextProvider maxHistoryLength={maxHistoryLength}>
        <DocExplorerContextProvider>
          <GraphiQLInterface
            confirmCloseTab={confirmCloseTab}
            showPersistHeadersSettings={shouldPersistHeaders !== false}
            forcedTheme={props.forcedTheme}
            {...props}
          />
        </DocExplorerContextProvider>
      </HistoryContextProvider>
    </GraphiQLProvider>
  );
};

type AddSuffix<Obj extends Record<string, any>, Suffix extends string> = {
  [Key in keyof Obj as `${string & Key}${Suffix}`]: Obj[Key];
};

export type GraphiQLInterfaceProps = WriteableEditorProps &
  AddSuffix<Pick<UseQueryEditorArgs, 'onEdit'>, 'Query'> &
  Pick<UseQueryEditorArgs, 'onCopyQuery' | 'onPrettifyQuery'> &
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
     * By default, the editor tools are initially shown when at least one of the
     * editors has contents.
     */
    defaultEditorToolsVisibility?: boolean | 'variables' | 'headers';
    /**
     * Toggle if the headers' editor should be shown inside the editor tools.
     * @default true
     */
    isHeadersEditorEnabled?: boolean;
    /**
     * Indicates if settings for persisting headers should appear in the
     * settings modal.
     */
    showPersistHeadersSettings?: boolean;
    defaultTheme?: Theme;
    /**
     * `forcedTheme` allows enforcement of a specific theme for GraphiQL.
     * This is useful when you want to make sure that GraphiQL is always
     * rendered with a specific theme.
     */
    forcedTheme?: (typeof THEMES)[number];
    /**
     * Additional class names which will be appended to the container element.
     */
    className?: string;
    /**
     * When the user clicks a close tab button, this function is invoked with
     * the index of the tab that is about to be closed. It can return a promise
     * that should resolve to `true` (meaning the tab may be closed) or `false`
     * (meaning the tab may not be closed).
     * @param index The index of the tab that should be closed.
     */
    confirmCloseTab?(index: number): Promise<boolean> | boolean;
  };

const THEMES = ['light', 'dark', 'system'] as const;

const TAB_CLASS_PREFIX = 'graphiql-session-tab-';

export const GraphiQLInterface: FC<GraphiQLInterfaceProps> = props => {
  const isHeadersEditorEnabled = props.isHeadersEditorEnabled ?? true;
  const {
    initialVariables,
    initialHeaders,
    setShouldPersistHeaders,
    addTab,
    moveTab,
    closeTab,
    changeTab,
    shouldPersistHeaders,
    tabs,
    activeTabIndex,
  } = useEditorContext({ nonNull: true });
  const executionContext = useExecutionContext({ nonNull: true });
  const { isFetching: isSchemaFetching, introspect } = useSchemaStore();
  const storageContext = useStorage();
  const { visiblePlugin, setVisiblePlugin, plugins } = usePluginStore();
  const forcedTheme =
    props.forcedTheme && THEMES.includes(props.forcedTheme)
      ? props.forcedTheme
      : undefined;
  const { theme, setTheme } = useTheme(props.defaultTheme);

  useEffect(() => {
    if (forcedTheme === 'system') {
      setTheme(null);
    } else if (forcedTheme === 'light' || forcedTheme === 'dark') {
      setTheme(forcedTheme);
    }
  }, [forcedTheme, setTheme]);

  const PluginContent = visiblePlugin?.content;

  const pluginResize = useDragResize({
    defaultSizeRelation: 1 / 3,
    direction: 'horizontal',
    initiallyHidden: visiblePlugin ? undefined : 'first',
    onHiddenElementChange(resizableElement) {
      if (resizableElement === 'first') {
        setVisiblePlugin(null);
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

      return initialVariables || initialHeaders ? undefined : 'second';
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
    return !initialVariables && initialHeaders && isHeadersEditorEnabled
      ? 'headers'
      : 'variables';
  });
  const [showDialog, setShowDialog] = useState<
    'settings' | 'short-keys' | null
  >(null);
  const [clearStorageStatus, setClearStorageStatus] = useState<
    'success' | 'error' | null
  >(null);

  const { logo, toolbar, footer, children } = Children.toArray(
    props.children,
  ).reduce<{
    logo?: ReactNode;
    toolbar?: ReactNode;
    footer?: ReactNode;
    children: ReactNode[];
  }>(
    (acc, curr) => {
      switch (getChildComponentType(curr)) {
        case GraphiQL.Logo:
          acc.logo = curr;
          break;
        case GraphiQL.Toolbar:
          // @ts-expect-error -- fix type error
          acc.toolbar = cloneElement(curr, {
            onCopyQuery: props.onCopyQuery,
            onPrettifyQuery: props.onPrettifyQuery,
          });
          break;
        case GraphiQL.Footer:
          acc.footer = curr;
          break;
        default:
          acc.children.push(curr);
      }
      return acc;
    },
    {
      logo: <GraphiQL.Logo />,
      toolbar: (
        <GraphiQL.Toolbar
          // @ts-expect-error -- Prop exists but hidden for users
          onCopyQuery={props.onCopyQuery}
          onPrettifyQuery={props.onPrettifyQuery}
        />
      ),
      children: [],
    },
  );

  const onClickReference = () => {
    if (pluginResize.hiddenElement === 'first') {
      pluginResize.setHiddenElement(null);
    }
  };

  const handleClearData = () => {
    try {
      storageContext.clear();
      setClearStorageStatus('success');
    } catch {
      setClearStorageStatus('error');
    }
  };

  const handlePersistHeaders: MouseEventHandler<HTMLButtonElement> = event => {
    setShouldPersistHeaders(event.currentTarget.dataset.value === 'true');
  };

  const handleChangeTheme: MouseEventHandler<HTMLButtonElement> = event => {
    const selectedTheme = event.currentTarget.dataset.theme as
      | 'light'
      | 'dark'
      | undefined;
    setTheme(selectedTheme || null);
  };

  const handleShowDialog: MouseEventHandler<HTMLButtonElement> = event => {
    setShowDialog(
      event.currentTarget.dataset.value as 'short-keys' | 'settings',
    );
  };

  const handlePluginClick: MouseEventHandler<HTMLButtonElement> = event => {
    const pluginIndex = Number(event.currentTarget.dataset.index!);
    const plugin = plugins.find((_, index) => pluginIndex === index)!;
    const isVisible = plugin === visiblePlugin;
    if (isVisible) {
      setVisiblePlugin(null);
      pluginResize.setHiddenElement('first');
    } else {
      setVisiblePlugin(plugin);
      pluginResize.setHiddenElement(null);
    }
  };

  const handleToolsTabClick: MouseEventHandler<HTMLButtonElement> = event => {
    if (editorToolsResize.hiddenElement === 'second') {
      editorToolsResize.setHiddenElement(null);
    }
    setActiveSecondaryEditor(
      event.currentTarget.dataset.name as 'variables' | 'headers',
    );
  };

  const toggleEditorTools: MouseEventHandler<HTMLButtonElement> = () => {
    editorToolsResize.setHiddenElement(
      editorToolsResize.hiddenElement === 'second' ? null : 'second',
    );
  };

  const handleOpenShortKeysDialog = (isOpen: boolean) => {
    if (!isOpen) {
      setShowDialog(null);
    }
  };

  const handleOpenSettingsDialog = (isOpen: boolean) => {
    if (!isOpen) {
      setShowDialog(null);
      setClearStorageStatus(null);
    }
  };
  const confirmClose = props.confirmCloseTab;

  const handleTabClose: MouseEventHandler<HTMLButtonElement> = async event => {
    const tabButton = event.currentTarget.previousSibling as HTMLButtonElement;
    const index = Number(tabButton.id.replace(TAB_CLASS_PREFIX, ''));

    /** TODO:
     * Move everything after into `editorContext.closeTab` once zustand will be used instead of
     * React context, since now we can't use execution context inside editor context, since editor
     * context is used in execution context.
     */
    const shouldCloseTab = confirmClose ? await confirmClose(index) : true;

    if (!shouldCloseTab) {
      return;
    }

    if (activeTabIndex === index) {
      executionContext.stop();
    }
    closeTab(index);
  };

  const handleTabClick: MouseEventHandler<HTMLButtonElement> = event => {
    const index = Number(event.currentTarget.id.replace(TAB_CLASS_PREFIX, ''));
    /** TODO:
     * Move everything after into `editorContext.changeTab` once zustand will be used instead of
     * React context, since now we can't use execution context inside editor context, since editor
     * context is used in execution context.
     */
    executionContext.stop();
    changeTab(index);
  };

  return (
    <Tooltip.Provider>
      <div className={cn('graphiql-container', props.className)}>
        <div className="graphiql-sidebar">
          {plugins.map((plugin, index) => {
            const isVisible = plugin === visiblePlugin;
            const label = `${isVisible ? 'Hide' : 'Show'} ${plugin.title}`;
            return (
              <Tooltip key={plugin.title} label={label}>
                <UnStyledButton
                  type="button"
                  className={cn(isVisible && 'active')}
                  onClick={handlePluginClick}
                  data-index={index}
                  aria-label={label}
                >
                  <plugin.icon aria-hidden="true" />
                </UnStyledButton>
              </Tooltip>
            );
          })}
          <Tooltip label="Re-fetch GraphQL schema">
            <UnStyledButton
              type="button"
              disabled={isSchemaFetching}
              onClick={introspect}
              aria-label="Re-fetch GraphQL schema"
              style={{ marginTop: 'auto' }}
            >
              <ReloadIcon
                className={cn(isSchemaFetching && 'graphiql-spin')}
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
        <div className="graphiql-main">
          <div
            ref={pluginResize.firstRef}
            className="graphiql-plugin"
            style={{
              // Make sure the container shrinks when containing long
              // non-breaking texts
              minWidth: '200px',
            }}
          >
            {PluginContent ? <PluginContent /> : null}
          </div>
          {visiblePlugin && (
            <div
              className="graphiql-horizontal-drag-bar"
              ref={pluginResize.dragBarRef}
            />
          )}
          <div ref={pluginResize.secondRef} className="graphiql-sessions">
            <div className="graphiql-session-header">
              <Tabs
                values={tabs}
                onReorder={moveTab}
                aria-label="Select active operation"
                className="no-scrollbar"
              >
                {tabs.map((tab, index, arr) => (
                  <Tab
                    key={tab.id}
                    value={tab}
                    isActive={index === activeTabIndex}
                  >
                    <Tab.Button
                      aria-controls="graphiql-session"
                      id={`graphiql-session-tab-${index}`}
                      title={tab.title}
                      onClick={handleTabClick}
                    >
                      {tab.title}
                    </Tab.Button>
                    {arr.length > 1 && <Tab.Close onClick={handleTabClose} />}
                  </Tab>
                ))}
              </Tabs>
              <Tooltip label="New tab">
                <UnStyledButton
                  type="button"
                  className="graphiql-tab-add"
                  onClick={addTab}
                  aria-label="New tab"
                >
                  <PlusIcon aria-hidden="true" />
                </UnStyledButton>
              </Tooltip>
              {logo}
            </div>
            <div
              role="tabpanel"
              id="graphiql-session" // used by aria-controls="graphiql-session"
              aria-labelledby={`${TAB_CLASS_PREFIX}${activeTabIndex}`}
            >
              <div className="graphiql-editors" ref={editorResize.firstRef}>
                <section
                  className="graphiql-query-editor"
                  aria-label="Query Editor"
                  ref={editorToolsResize.firstRef}
                >
                  <QueryEditor
                    editorTheme={props.editorTheme}
                    keyMap={props.keyMap}
                    onClickReference={onClickReference}
                    onCopyQuery={props.onCopyQuery}
                    onPrettifyQuery={props.onPrettifyQuery}
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

                <div
                  ref={editorToolsResize.dragBarRef}
                  className="graphiql-editor-tools"
                >
                  <UnStyledButton
                    type="button"
                    className={cn(
                      activeSecondaryEditor === 'variables' &&
                        editorToolsResize.hiddenElement !== 'second' &&
                        'active',
                    )}
                    onClick={handleToolsTabClick}
                    data-name="variables"
                  >
                    Variables
                  </UnStyledButton>
                  {isHeadersEditorEnabled && (
                    <UnStyledButton
                      type="button"
                      className={cn(
                        activeSecondaryEditor === 'headers' &&
                          editorToolsResize.hiddenElement !== 'second' &&
                          'active',
                      )}
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

                <section
                  className="graphiql-editor-tool"
                  aria-label={
                    activeSecondaryEditor === 'variables'
                      ? 'Variables'
                      : 'Headers'
                  }
                  ref={editorToolsResize.secondRef}
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

              <div
                className="graphiql-horizontal-drag-bar"
                ref={editorResize.dragBarRef}
              />

              <div className="graphiql-response" ref={editorResize.secondRef}>
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
            <ShortKeys keyMap={props.keyMap} />
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
                  className={cn(shouldPersistHeaders && 'active')}
                  data-value="true"
                  onClick={handlePersistHeaders}
                >
                  On
                </Button>
                <Button
                  type="button"
                  id="disable-persist-headers"
                  className={cn(!shouldPersistHeaders && 'active')}
                  onClick={handlePersistHeaders}
                >
                  Off
                </Button>
              </ButtonGroup>
            </div>
          ) : null}
          {!forcedTheme && (
            <div className="graphiql-dialog-section">
              <div>
                <div className="graphiql-dialog-section-title">Theme</div>
                <div className="graphiql-dialog-section-caption">
                  Adjust how the interface appears.
                </div>
              </div>
              <ButtonGroup>
                <Button
                  type="button"
                  className={cn(theme === null && 'active')}
                  onClick={handleChangeTheme}
                >
                  System
                </Button>
                <Button
                  type="button"
                  className={cn(theme === 'light' && 'active')}
                  data-theme="light"
                  onClick={handleChangeTheme}
                >
                  Light
                </Button>
                <Button
                  type="button"
                  className={cn(theme === 'dark' && 'active')}
                  data-theme="dark"
                  onClick={handleChangeTheme}
                >
                  Dark
                </Button>
              </ButtonGroup>
            </div>
          )}
          <div className="graphiql-dialog-section">
            <div>
              <div className="graphiql-dialog-section-title">Clear storage</div>
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
        </Dialog>
      </div>
      {children}
    </Tooltip.Provider>
  );
};

const modifier = isMacOs ? '⌘' : 'Ctrl';

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

interface ShortKeysProps {
  /** @default 'sublime' */
  keyMap?: string;
}

const ShortKeys: FC<ShortKeysProps> = ({ keyMap = 'sublime' }) => {
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
};

const defaultGraphiqlLogo = (
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
);

// Configure the UI by providing this Component as a child of GraphiQL.
const GraphiQLLogo: FC<{ children?: ReactNode }> = ({
  children = defaultGraphiqlLogo,
}) => {
  return <div className="graphiql-logo">{children}</div>;
};

const DefaultToolbarRenderProps: FC<{
  prettify: ReactNode;
  copy: ReactNode;
  merge: ReactNode;
}> = ({ prettify, copy, merge }) => (
  <>
    {prettify}
    {merge}
    {copy}
  </>
);

// Configure the UI by providing this Component as a child of GraphiQL.
const GraphiQLToolbar: FC<{
  children?: typeof DefaultToolbarRenderProps;
}> = ({
  children = DefaultToolbarRenderProps,
  // @ts-expect-error -- Hide this prop for user, we use cloneElement to pass onCopyQuery
  onCopyQuery,
  // @ts-expect-error -- Hide this prop for user, we use cloneElement to pass onPrettifyQuery
  onPrettifyQuery,
}) => {
  // eslint-disable-next-line react-hooks/react-compiler
  'use no memo';
  if (typeof children !== 'function') {
    throw new TypeError(
      'The `GraphiQL.Toolbar` component requires a render prop function as its child.',
    );
  }
  const onCopy = useCopyQuery({ onCopyQuery });
  const onMerge = useMergeQuery();
  const onPrettify = usePrettifyEditors({ onPrettifyQuery });

  const prettify = (
    <ToolbarButton onClick={onPrettify} label="Prettify query (Shift-Ctrl-P)">
      <PrettifyIcon className="graphiql-toolbar-icon" aria-hidden="true" />
    </ToolbarButton>
  );

  const merge = (
    <ToolbarButton
      onClick={onMerge}
      label="Merge fragments into query (Shift-Ctrl-M)"
    >
      <MergeIcon className="graphiql-toolbar-icon" aria-hidden="true" />
    </ToolbarButton>
  );

  const copy = (
    <ToolbarButton onClick={onCopy} label="Copy query (Shift-Ctrl-C)">
      <CopyIcon className="graphiql-toolbar-icon" aria-hidden="true" />
    </ToolbarButton>
  );

  return children({ prettify, copy, merge });
};

// Configure the UI by providing this Component as a child of GraphiQL.
const GraphiQLFooter: FC<{ children: ReactNode }> = props => {
  return <div className="graphiql-footer">{props.children}</div>;
};

function getChildComponentType(child: ReactNode) {
  if (
    child &&
    typeof child === 'object' &&
    'type' in child &&
    typeof child.type === 'function'
  ) {
    return child.type;
  }
}

// Export main windows/panes to be used separately if desired.
export const GraphiQL = Object.assign(GraphiQL_, {
  Logo: GraphiQLLogo,
  Toolbar: GraphiQLToolbar,
  Footer: GraphiQLFooter,
});
