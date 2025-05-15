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
import { useState, useEffect, Children } from 'react';
import {
  Button,
  ButtonGroup,
  ChevronDownIcon,
  ChevronUpIcon,
  Dialog,
  ExecuteButton,
  GraphiQLProvider,
  HeaderEditor,
  KeyboardShortcutIcon,
  PlusIcon,
  QueryEditor,
  ReloadIcon,
  ResponseEditor,
  SettingsIcon,
  Spinner,
  Tab,
  Tabs,
  Theme,
  Tooltip,
  UnStyledButton,
  useDragResize,
  useEditorStore,
  useExecutionStore,
  usePluginStore,
  useSchemaStore,
  useStorage,
  useTheme,
  VariableEditor,
  WriteableEditorProps,
  cn,
} from '@graphiql/react';
import { HistoryStore, HISTORY_PLUGIN } from '@graphiql/plugin-history';
import {
  DocExplorerStore,
  DOC_EXPLORER_PLUGIN,
} from '@graphiql/plugin-doc-explorer';
import { GraphiQLLogo, GraphiQLToolbar, GraphiQLFooter, ShortKeys } from './ui';

/**
 * API docs for this live here:
 *
 * https://graphiql-test.netlify.app/typedoc/modules/graphiql.html#graphiqlprops
 */
export type GraphiQLProps =
  //
  Omit<ComponentPropsWithoutRef<typeof GraphiQLProvider>, 'children'> &
    Omit<ComponentPropsWithoutRef<typeof HistoryStore>, 'children'> &
    // `children` prop should be optional
    GraphiQLInterfaceProps;

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */
const GraphiQL_: FC<GraphiQLProps> = ({
  maxHistoryLength,
  plugins = [],
  referencePlugin = DOC_EXPLORER_PLUGIN,

  editorTheme,
  keyMap,
  readOnly,
  onEditQuery,
  onEditVariables,
  onEditHeaders,
  responseTooltip,
  defaultEditorToolsVisibility,
  isHeadersEditorEnabled,
  showPersistHeadersSettings,
  defaultTheme,
  forcedTheme,
  confirmCloseTab,
  className,

  children,
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
  const interfaceProps: GraphiQLInterfaceProps = {
    // TODO check if `showPersistHeadersSettings` prop is needed, or we can just use `shouldPersistHeaders` instead
    showPersistHeadersSettings:
      showPersistHeadersSettings ?? props.shouldPersistHeaders !== false,
    editorTheme,
    keyMap,
    readOnly,
    onEditQuery,
    onEditVariables,
    onEditHeaders,
    responseTooltip,
    defaultEditorToolsVisibility,
    isHeadersEditorEnabled: isHeadersEditorEnabled ?? true,
    defaultTheme,
    forcedTheme:
      forcedTheme && THEMES.includes(forcedTheme) ? forcedTheme : undefined,
    confirmCloseTab,
    className,
  };
  return (
    <GraphiQLProvider
      plugins={[referencePlugin, HISTORY_PLUGIN, ...plugins]}
      referencePlugin={referencePlugin}
      {...props}
    >
      <HistoryStore maxHistoryLength={maxHistoryLength}>
        <DocExplorerStore>
          <Tooltip.Provider>
            <GraphiQLInterface {...interfaceProps}>
              {children}
            </GraphiQLInterface>
          </Tooltip.Provider>
        </DocExplorerStore>
      </HistoryStore>
    </GraphiQLProvider>
  );
};

type AddSuffix<Obj extends Record<string, any>, Suffix extends string> = {
  [Key in keyof Obj as `${string & Key}${Suffix}`]: Obj[Key];
};

type QueryEditorProps = ComponentPropsWithoutRef<typeof QueryEditor>;
type VariableEditorProps = ComponentPropsWithoutRef<typeof VariableEditor>;
type HeaderEditorProps = ComponentPropsWithoutRef<typeof HeaderEditor>;
type ResponseEditorProps = ComponentPropsWithoutRef<typeof ResponseEditor>;

export type GraphiQLInterfaceProps = WriteableEditorProps &
  AddSuffix<Pick<QueryEditorProps, 'onEdit'>, 'Query'> &
  AddSuffix<Pick<VariableEditorProps, 'onEdit'>, 'Variables'> &
  AddSuffix<Pick<HeaderEditorProps, 'onEdit'>, 'Headers'> &
  Pick<ResponseEditorProps, 'responseTooltip'> & {
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

type ButtonHandler = MouseEventHandler<HTMLButtonElement>;

export const GraphiQLInterface: FC<GraphiQLInterfaceProps> = ({
  forcedTheme,
  isHeadersEditorEnabled,
  defaultTheme,
  defaultEditorToolsVisibility,
  children,
  confirmCloseTab,
  className,
  editorTheme,
  keyMap,
  onEditQuery,
  readOnly,
  onEditVariables,
  onEditHeaders,
  responseTooltip,
  showPersistHeadersSettings,
}) => {
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
  } = useEditorStore();
  const isExecutionFetching = useExecutionStore(store => store.isFetching);
  const { isFetching: isSchemaFetching, introspect } = useSchemaStore();
  const storageContext = useStorage();
  const { visiblePlugin, setVisiblePlugin, plugins } = usePluginStore();
  const { theme, setTheme } = useTheme(defaultTheme);

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
        defaultEditorToolsVisibility === 'variables' ||
        defaultEditorToolsVisibility === 'headers'
      ) {
        return;
      }

      if (typeof defaultEditorToolsVisibility === 'boolean') {
        return defaultEditorToolsVisibility ? undefined : 'second';
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
      defaultEditorToolsVisibility === 'variables' ||
      defaultEditorToolsVisibility === 'headers'
    ) {
      return defaultEditorToolsVisibility;
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

  const { logo, toolbar, footer } = Children.toArray(children).reduce<{
    logo?: ReactNode;
    toolbar?: ReactNode;
    footer?: ReactNode;
  }>(
    (acc, curr) => {
      switch (getChildComponentType(curr)) {
        case GraphiQL.Logo:
          acc.logo = curr;
          break;
        case GraphiQL.Toolbar:
          acc.toolbar = curr;
          break;
        case GraphiQL.Footer:
          acc.footer = curr;
          break;
      }
      return acc;
    },
    {
      logo: <GraphiQL.Logo />,
      toolbar: <GraphiQL.Toolbar />,
    },
  );

  function onClickReference() {
    if (pluginResize.hiddenElement === 'first') {
      pluginResize.setHiddenElement(null);
    }
  }

  function handleClearData() {
    try {
      storageContext.clear();
      setClearStorageStatus('success');
    } catch {
      setClearStorageStatus('error');
    }
  }

  const handlePersistHeaders: ButtonHandler = event => {
    setShouldPersistHeaders(event.currentTarget.dataset.value === 'true');
  };

  const handleChangeTheme: ButtonHandler = event => {
    const selectedTheme = event.currentTarget.dataset.theme as
      | 'light'
      | 'dark'
      | undefined;
    setTheme(selectedTheme || null);
  };

  const handleShowDialog: ButtonHandler = event => {
    setShowDialog(
      event.currentTarget.dataset.value as 'short-keys' | 'settings',
    );
  };

  const handlePluginClick: ButtonHandler = event => {
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

  const handleToolsTabClick: ButtonHandler = event => {
    if (editorToolsResize.hiddenElement === 'second') {
      editorToolsResize.setHiddenElement(null);
    }
    setActiveSecondaryEditor(
      event.currentTarget.dataset.name as 'variables' | 'headers',
    );
  };

  const toggleEditorTools: ButtonHandler = () => {
    editorToolsResize.setHiddenElement(
      editorToolsResize.hiddenElement === 'second' ? null : 'second',
    );
  };

  function handleOpenShortKeysDialog(isOpen: boolean) {
    if (!isOpen) {
      setShowDialog(null);
    }
  }

  function handleOpenSettingsDialog(isOpen: boolean) {
    if (!isOpen) {
      setShowDialog(null);
      setClearStorageStatus(null);
    }
  }

  const handleTabClose: ButtonHandler = async event => {
    const tabButton = event.currentTarget.previousSibling as HTMLButtonElement;
    const index = Number(tabButton.id.replace(TAB_CLASS_PREFIX, ''));
    const shouldCloseTab = confirmCloseTab
      ? await confirmCloseTab(index)
      : true;

    if (!shouldCloseTab) {
      return;
    }
    closeTab(index);
  };

  const handleTabClick: ButtonHandler = event => {
    const index = Number(event.currentTarget.id.replace(TAB_CLASS_PREFIX, ''));
    changeTab(index);
  };

  const sidebar = (
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
          <ShortKeys keyMap={keyMap} />
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
        {showPersistHeadersSettings ? (
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
  );

  const editorToolsText =
    editorToolsResize.hiddenElement === 'second'
      ? 'Show editor tools'
      : 'Hide editor tools';

  const EditorToolsIcon =
    editorToolsResize.hiddenElement === 'second'
      ? ChevronUpIcon
      : ChevronDownIcon;

  const editors = (
    <div className="graphiql-editors" ref={editorResize.firstRef}>
      <section
        className="graphiql-query-editor"
        aria-label="Query Editor"
        ref={editorToolsResize.firstRef}
      >
        <QueryEditor
          editorTheme={editorTheme}
          keyMap={keyMap}
          onClickReference={onClickReference}
          onEdit={onEditQuery}
          readOnly={readOnly}
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

      <div ref={editorToolsResize.dragBarRef} className="graphiql-editor-tools">
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

        <Tooltip label={editorToolsText}>
          <UnStyledButton
            type="button"
            onClick={toggleEditorTools}
            aria-label={editorToolsText}
            className="graphiql-toggle-editor-tools"
          >
            <EditorToolsIcon
              className="graphiql-chevron-icon"
              aria-hidden="true"
            />
          </UnStyledButton>
        </Tooltip>
      </div>

      <section
        className="graphiql-editor-tool"
        aria-label={
          activeSecondaryEditor === 'variables' ? 'Variables' : 'Headers'
        }
        ref={editorToolsResize.secondRef}
      >
        <VariableEditor
          editorTheme={editorTheme}
          isHidden={activeSecondaryEditor !== 'variables'}
          keyMap={keyMap}
          onEdit={onEditVariables}
          onClickReference={onClickReference}
          readOnly={readOnly}
        />
        {isHeadersEditorEnabled && (
          <HeaderEditor
            editorTheme={editorTheme}
            isHidden={activeSecondaryEditor !== 'headers'}
            keyMap={keyMap}
            onEdit={onEditHeaders}
            readOnly={readOnly}
          />
        )}
      </section>
    </div>
  );

  return (
    <div className={cn('graphiql-container', className)}>
      {sidebar}
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
            {editors}
            <div
              className="graphiql-horizontal-drag-bar"
              ref={editorResize.dragBarRef}
            />
            <div className="graphiql-response" ref={editorResize.secondRef}>
              {isExecutionFetching && <Spinner />}
              <ResponseEditor
                editorTheme={editorTheme}
                responseTooltip={responseTooltip}
                keyMap={keyMap}
              />
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
