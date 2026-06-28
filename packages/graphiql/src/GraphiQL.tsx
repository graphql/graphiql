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
import { Children, useRef, useState, Fragment } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  ExecuteButton,
  GraphiQLProvider,
  PlusIcon,
  PortalProvider,
  PrettifyIcon,
  QueryEditor,
  ResponseEditor,
  SaveIcon,
  SidePanel,
  Spinner,
  Tab,
  Tabs,
  Tooltip,
  TopBar,
  StatusBar,
  UnStyledButton,
  VarHeadersStrip,
  useDragResize,
  useGraphiQL,
  useGraphiQLSettings,
  pick,
  EditorProps,
  cn,
  useGraphiQLActions,
  useMonaco,
  VariableEditor,
  HeaderEditor,
} from '@graphiql/react';
import type { Fetcher, Transport } from '@graphiql/toolkit';
import { HistoryStore, HISTORY_PLUGIN } from '@graphiql/plugin-history';
import {
  DocExplorerStore,
  DOC_EXPLORER_PLUGIN,
} from '@graphiql/plugin-doc-explorer';
import { QUERY_BUILDER_PLUGIN } from '@graphiql/plugin-query-builder';
import {
  ActivityBar,
  GraphiQLLogo,
  GraphiQLToolbar,
  GraphiQLFooter,
} from './ui';

/**
 * API docs for this live here:
 *
 * https://graphiql-test.netlify.app/typedoc/modules/graphiql.html#graphiqlprops
 *
 * Note: the XOR between `fetcher` and `transport` is preserved here explicitly.
 * `Omit` flattens discriminated unions, so it has to be re-applied at this
 * level so passing both props is a compile error at the `<GraphiQL>` call site.
 */
export type GraphiQLProps = GraphiQLInterfaceProps &
  Omit<ComponentPropsWithoutRef<typeof HistoryStore>, 'children'> &
  Omit<
    ComponentPropsWithoutRef<typeof GraphiQLProvider>,
    'children' | 'fetcher' | 'transport'
  > &
  (
    | { fetcher: Fetcher; transport?: never }
    | { transport: Transport; fetcher?: never }
  );

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */
const GraphiQL_: FC<GraphiQLProps> = ({
  maxHistoryLength,
  plugins = [HISTORY_PLUGIN, QUERY_BUILDER_PLUGIN],
  referencePlugin = DOC_EXPLORER_PLUGIN,
  onEditQuery,
  onEditVariables,
  onEditHeaders,
  responseTooltip,
  defaultEditorToolsVisibility,
  isHeadersEditorEnabled,
  showPersistHeadersSettings,
  forcedTheme,
  confirmCloseTab,
  className,

  children,
  ...props
}) => {
  // @ts-expect-error -- Prop is removed
  if (props.toolbar?.additionalContent) {
    throw new TypeError(
      'The `toolbar.additionalContent` prop has been removed. Use render props on `GraphiQL.Toolbar` component instead.',
    );
  }
  // @ts-expect-error -- Prop is removed
  if (props.toolbar?.additionalComponent) {
    throw new TypeError(
      'The `toolbar.additionalComponent` prop has been removed. Use render props on `GraphiQL.Toolbar` component instead.',
    );
  }
  // @ts-expect-error -- Prop is removed
  if (props.keyMap) {
    throw new TypeError(
      '`keyMap` was removed. To use Vim or Emacs keybindings in Monaco, you can use community plugins. Monaco Vim: https://github.com/brijeshb42/monaco-vim. Monaco Emacs: https://github.com/aioutecism/monaco-emacs',
    );
  }
  // @ts-expect-error -- Prop is removed
  if (props.readOnly) {
    throw new TypeError('The `readOnly` prop has been removed.');
  }
  const interfaceProps: GraphiQLInterfaceProps = {
    // TODO check if `showPersistHeadersSettings` prop is needed, or we can just use `shouldPersistHeaders` instead
    showPersistHeadersSettings:
      showPersistHeadersSettings ?? props.shouldPersistHeaders !== false,
    onEditQuery,
    onEditVariables,
    onEditHeaders,
    responseTooltip,
    defaultEditorToolsVisibility,
    isHeadersEditorEnabled,
    forcedTheme,
    confirmCloseTab,
    className,
  };
  const hasHistoryPlugin = plugins.includes(HISTORY_PLUGIN);
  const HistoryToUse = hasHistoryPlugin ? HistoryStore : Fragment;
  const DocExplorerToUse =
    referencePlugin === DOC_EXPLORER_PLUGIN ? DocExplorerStore : Fragment;

  return (
    <GraphiQLProvider
      plugins={[...(referencePlugin ? [referencePlugin] : []), ...plugins]}
      referencePlugin={referencePlugin}
      {...props}
    >
      <HistoryToUse {...(hasHistoryPlugin && { maxHistoryLength })}>
        <DocExplorerToUse>
          <GraphiQLInterface {...interfaceProps}>{children}</GraphiQLInterface>
        </DocExplorerToUse>
      </HistoryToUse>
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

export interface GraphiQLInterfaceProps
  extends
    EditorProps,
    AddSuffix<Pick<QueryEditorProps, 'onEdit'>, 'Query'>,
    AddSuffix<Pick<VariableEditorProps, 'onEdit'>, 'Variables'>,
    AddSuffix<Pick<HeaderEditorProps, 'onEdit'>, 'Headers'>,
    Pick<ResponseEditorProps, 'responseTooltip'>,
    Pick<
      ComponentPropsWithoutRef<typeof ActivityBar>,
      'forcedTheme' | 'showPersistHeadersSettings'
    > {
  children?: ReactNode;
  /**
   * Set the default state for the editor tools.
   * - `false` hides the editor tools
   * - `true` shows the editor tools
   * - `'variables'` specifically shows the variables editor
   * - `'headers'` specifically shows the request headers editor
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
   * Additional class names which will be appended to the container element.
   */
  className?: string;

  /**
   * When the user clicks a close tab button, this function is invoked with
   * the index of the tab that is about to be closed. It can return a promise
   * that should resolve to `true` (meaning the tab may be closed) or `false`
   * (meaning the tab may not be closed).
   * @param index - The index of the tab that should be closed.
   */
  confirmCloseTab?(index: number): Promise<boolean> | boolean;
}

const TAB_CLASS_PREFIX = 'graphiql-session-tab-';

type ButtonHandler = MouseEventHandler<HTMLButtonElement>;

const LABEL = {
  newTab: 'New tab',
  prettify: 'Prettify query',
  copy: 'Copy query',
  save: 'Save query',
};

export const GraphiQLInterface: FC<GraphiQLInterfaceProps> = ({
  forcedTheme,
  defaultEditorToolsVisibility,
  isHeadersEditorEnabled = true,
  children: $children,
  confirmCloseTab,
  className,
  onEditQuery,
  onEditVariables,
  onEditHeaders,
  responseTooltip,
  showPersistHeadersSettings,
}) => {
  const {
    addTab,
    moveTab,
    closeTab,
    changeTab,
    setVisiblePlugin,
    saveQuery,
    copyQuery,
    prettifyEditors,
  } = useGraphiQLActions();
  const {
    initialVariables,
    initialHeaders,
    tabs,
    activeTabIndex,
    isFetching,
    visiblePlugin,
    operations,
  } = useGraphiQL(
    pick(
      'initialVariables',
      'initialHeaders',
      'tabs',
      'activeTabIndex',
      'isFetching',
      'visiblePlugin',
      'operations',
    ),
  );
  const hasMonaco = useMonaco(state => Boolean(state.monaco));

  const containerRef = useRef<HTMLDivElement>(null);
  // Radix portals (dialogs, tooltips, dropdowns) render into this element so
  // they inherit the container's `data-theme` / `data-density` / `data-font-size`
  // tokens instead of escaping to `document.body`. It lives in state so portals
  // re-render into it once the container mounts.
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const setContainerRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    setPortalContainer(node);
  };
  useGraphiQLSettings(containerRef);

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
    initiallyHidden: ((d: typeof defaultEditorToolsVisibility) => {
      if (d === 'variables' || d === 'headers') {
        return;
      }
      if (typeof d === 'boolean') {
        return d ? undefined : 'second';
      }
      return initialVariables || initialHeaders ? undefined : 'second';
    })(defaultEditorToolsVisibility),
    sizeThresholdSecond: 60,
    storageKey: 'secondaryEditorFlex',
  });

  const { logo, toolbar, footer, children } = Children.toArray(
    $children,
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
          acc.toolbar = curr;
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
      toolbar: <GraphiQL.Toolbar />,
      children: [],
    },
  );

  function onClickReference() {
    if (pluginResize.hiddenElement === 'first') {
      pluginResize.setHiddenElement(null);
    }
  }

  const toggleEditorTools: ButtonHandler = () => {
    editorToolsResize.setHiddenElement(
      editorToolsResize.hiddenElement === 'second' ? null : 'second',
    );
  };

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

  const editorToolsText = `${editorToolsResize.hiddenElement === 'second' ? 'Show' : 'Hide'} editor tools`;

  const EditorToolsIcon =
    editorToolsResize.hiddenElement === 'second'
      ? ChevronUpIcon
      : ChevronDownIcon;

  const editors = (
    <div className="graphiql-editors" ref={editorResize.firstRef}>
      <section
        className="graphiql-query-editor"
        aria-label="Operation Editor"
        ref={editorToolsResize.firstRef}
      >
        {hasMonaco ? (
          <QueryEditor
            onClickReference={onClickReference}
            onEdit={onEditQuery}
          />
        ) : (
          <Spinner />
        )}

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
        aria-label="Variables and Headers"
        ref={editorToolsResize.secondRef}
      >
        <VarHeadersStrip
          defaultTab={((d: typeof defaultEditorToolsVisibility) => {
            if (d === 'variables' || d === 'headers') {
              return d;
            }
            return !initialVariables && initialHeaders && isHeadersEditorEnabled
              ? 'headers'
              : 'variables';
          })(defaultEditorToolsVisibility)}
          headersEditorEnabled={isHeadersEditorEnabled}
          onEditVariables={onEditVariables}
          onEditHeaders={onEditHeaders}
        />
      </section>
    </div>
  );

  const tabContainerRef = useRef<HTMLUListElement>(null!);

  return (
    <Tooltip.Provider>
      <PortalProvider container={portalContainer}>
        <div
          ref={setContainerRef}
          className={cn('graphiql-container', className)}
        >
          <TopBar />
          <div className="graphiql-body">
            <ActivityBar
              forcedTheme={forcedTheme}
              showPersistHeadersSettings={showPersistHeadersSettings}
              setHiddenElement={pluginResize.setHiddenElement}
            />
            <div className="graphiql-main">
              <div ref={pluginResize.firstRef} className="graphiql-plugin">
                <SidePanel />
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
                    ref={tabContainerRef}
                    values={tabs}
                    onReorder={moveTab}
                    aria-label="Select active operation"
                    className="no-scrollbar"
                  >
                    {tabs.map((tab, index) => {
                      const isActive = index === activeTabIndex;
                      // For the active tab, surface how many other operations the
                      // document holds alongside the one the cursor is in. Only
                      // when the active operation is named, so the title reads as
                      // `<name> +N`; an anonymous active operation has no name to
                      // anchor the count to.
                      const otherOperations =
                        isActive && tab.operationName && operations
                          ? operations.length - 1
                          : 0;
                      const tabTitle =
                        otherOperations > 0
                          ? `${tab.title} +${otherOperations}`
                          : tab.title;
                      return (
                        <Tab
                          key={tab.id}
                          // Prevent overscroll over container
                          dragConstraints={tabContainerRef}
                          value={tab}
                          isActive={isActive}
                          isDirty={tab.query !== tab.lastSavedQuery}
                        >
                          <Tab.Button
                            aria-controls="graphiql-session"
                            id={`graphiql-session-tab-${index}`}
                            title={tabTitle}
                            onClick={handleTabClick}
                          >
                            {tabTitle}
                          </Tab.Button>
                          {tabs.length > 1 && (
                            <Tab.Close onClick={handleTabClose} />
                          )}
                        </Tab>
                      );
                    })}
                  </Tabs>
                  <Tooltip label={LABEL.newTab}>
                    <UnStyledButton
                      type="button"
                      className="graphiql-tab-add"
                      onClick={addTab}
                      aria-label={LABEL.newTab}
                    >
                      <PlusIcon aria-hidden="true" />
                    </UnStyledButton>
                  </Tooltip>
                  <div className="graphiql-tab-strip-actions">
                    <Tooltip label={LABEL.prettify}>
                      <UnStyledButton
                        type="button"
                        className="graphiql-tab-strip-action"
                        onClick={prettifyEditors}
                        aria-label={LABEL.prettify}
                      >
                        <PrettifyIcon aria-hidden="true" />
                      </UnStyledButton>
                    </Tooltip>
                    <Tooltip label={LABEL.copy}>
                      <UnStyledButton
                        type="button"
                        className="graphiql-tab-strip-action"
                        onClick={copyQuery}
                        aria-label={LABEL.copy}
                      >
                        <CopyIcon aria-hidden="true" />
                      </UnStyledButton>
                    </Tooltip>
                    <Tooltip label={LABEL.save}>
                      <UnStyledButton
                        type="button"
                        className="graphiql-tab-strip-action"
                        onClick={saveQuery}
                        aria-label={LABEL.save}
                      >
                        <SaveIcon aria-hidden="true" />
                      </UnStyledButton>
                    </Tooltip>
                  </div>
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
                  <div
                    className="graphiql-response"
                    ref={editorResize.secondRef}
                  >
                    {isFetching && <Spinner />}
                    <ResponseEditor responseTooltip={responseTooltip} />
                    {footer}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <StatusBar />
        </div>
        {children}
      </PortalProvider>
    </Tooltip.Provider>
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
