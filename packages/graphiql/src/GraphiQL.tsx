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
import { useState, Children, useRef, Fragment } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExecuteButton,
  GraphiQLProvider,
  HeaderEditor,
  PlusIcon,
  QueryEditor,
  ResponseEditor,
  Spinner,
  Tab,
  Tabs,
  Tooltip,
  UnStyledButton,
  useDragResize,
  useGraphiQL,
  pick,
  VariableEditor,
  EditorProps,
  cn,
  useGraphiQLActions,
  useMonaco,
} from '@graphiql/react';
import { HistoryStore, HISTORY_PLUGIN } from '@graphiql/plugin-history';
import {
  DocExplorerStore,
  DOC_EXPLORER_PLUGIN,
} from '@graphiql/plugin-doc-explorer';
import { GraphiQLLogo, GraphiQLToolbar, GraphiQLFooter, Sidebar } from './ui';

/**
 * API docs for this live here:
 *
 * https://graphiql-test.netlify.app/typedoc/modules/graphiql.html#graphiqlprops
 */
export interface GraphiQLProps
  // `children` prop should be optional
  extends GraphiQLInterfaceProps,
    Omit<ComponentPropsWithoutRef<typeof GraphiQLProvider>, 'children'>,
    Omit<ComponentPropsWithoutRef<typeof HistoryStore>, 'children'> {}

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */
const GraphiQL_: FC<GraphiQLProps> = ({
  maxHistoryLength,
  plugins = [HISTORY_PLUGIN],
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
  extends EditorProps,
    AddSuffix<Pick<QueryEditorProps, 'onEdit'>, 'Query'>,
    AddSuffix<Pick<VariableEditorProps, 'onEdit'>, 'Variables'>,
    AddSuffix<Pick<HeaderEditorProps, 'onEdit'>, 'Headers'>,
    Pick<ResponseEditorProps, 'responseTooltip'>,
    Pick<
      ComponentPropsWithoutRef<typeof Sidebar>,
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
};

export const GraphiQLInterface: FC<GraphiQLInterfaceProps> = ({
  forcedTheme,
  isHeadersEditorEnabled = true,
  defaultEditorToolsVisibility,
  children: $children,
  confirmCloseTab,
  className,
  onEditQuery,
  onEditVariables,
  onEditHeaders,
  responseTooltip,
  showPersistHeadersSettings,
}) => {
  const { addTab, moveTab, closeTab, changeTab, setVisiblePlugin } =
    useGraphiQLActions();
  const {
    initialVariables,
    initialHeaders,
    tabs,
    activeTabIndex,
    isFetching,
    visiblePlugin,
  } = useGraphiQL(
    pick(
      'initialVariables',
      'initialHeaders',
      'tabs',
      'activeTabIndex',
      'isFetching',
      'visiblePlugin',
    ),
  );
  const hasMonaco = useMonaco(state => Boolean(state.monaco));

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

  const handleToolsTabClick: ButtonHandler = event => {
    if (editorToolsResize.hiddenElement === 'second') {
      editorToolsResize.setHiddenElement(null);
    }
    const tabName = event.currentTarget.dataset.name as 'variables' | 'headers';
    setActiveSecondaryEditor(tabName);
  };

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
          className={activeSecondaryEditor === 'variables' ? '' : 'hidden'}
          onEdit={onEditVariables}
        />
        {isHeadersEditorEnabled && (
          <HeaderEditor
            className={activeSecondaryEditor === 'headers' ? '' : 'hidden'}
            onEdit={onEditHeaders}
          />
        )}
      </section>
    </div>
  );

  const tabContainerRef = useRef<HTMLUListElement>(null!);

  return (
    <Tooltip.Provider>
      <div className={cn('graphiql-container', className)}>
        <Sidebar
          forcedTheme={forcedTheme}
          showPersistHeadersSettings={showPersistHeadersSettings}
          setHiddenElement={pluginResize.setHiddenElement}
        />
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
            {PluginContent && <PluginContent />}
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
                {tabs.map((tab, index, arr) => (
                  <Tab
                    key={tab.id}
                    // Prevent overscroll over container
                    dragConstraints={tabContainerRef}
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
                {isFetching && <Spinner />}
                <ResponseEditor responseTooltip={responseTooltip} />
                {footer}
              </div>
            </div>
          </div>
        </div>
      </div>
      {children}
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
