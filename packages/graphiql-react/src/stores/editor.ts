import type { StateCreator } from 'zustand';
import type {
  FragmentDefinitionNode,
  OperationDefinitionNode,
  DocumentNode,
} from 'graphql';
import type { OperationFacts } from 'graphql-language-service';
import { MaybePromise, mergeAst } from '@graphiql/toolkit';
import { print } from 'graphql';
import {
  createTab,
  setPropertiesInActiveTab,
  TabDefinition,
  TabsState,
  TabState,
  clearHeadersFromTabs,
  serializeTabState,
} from '../utility/tabs';
import type { SlicesWithActions, MonacoEditor } from '../types';
import { debounce, formatJSONC } from '../utility';
import { STORAGE_KEY } from '../constants';

export interface EditorSlice extends TabsState {
  /**
   * Unique ID of the GraphiQL instance, which will be suffixed to the URIs for operations,
   * variables, headers, and response editors.
   *
   * @see https://github.com/microsoft/monaco-editor#uris
   */
  uriInstanceId: string;
  /**
   * The Monaco Editor instance used in the request headers editor, used to edit HTTP headers.
   */
  headerEditor?: MonacoEditor;

  /**
   * The Monaco Editor instance used in the operation editor.
   */
  queryEditor?: MonacoEditor;

  /**
   * The Monaco Editor instance used in the response editor.
   */
  responseEditor?: MonacoEditor;

  /**
   * The Monaco Editor instance used in the variables editor.
   */
  variableEditor?: MonacoEditor;

  /**
   * The contents of the request headers editor when initially rendering the provider
   * component.
   */
  initialHeaders: string;

  /**
   * The contents of the operation editor when initially rendering the provider
   * component.
   */
  initialQuery: string;

  /**
   * The contents of the variables editor when initially rendering the provider
   * component.
   */
  initialVariables: string;

  /**
   * A map of fragment definitions using the fragment name as a key which are
   * made available to include in the query.
   */
  externalFragments: Map<string, FragmentDefinitionNode>;

  /**
   * If the contents of the request headers editor are persisted in storage.
   */
  shouldPersistHeaders: boolean;

  /**
   * The initial content of the operation editor when loading GraphiQL and there is
   * no saved query in storage and no `initialQuery` prop.
   *
   * This value is used only for the first tab. Additional tabs will open with
   * an empty operation editor.
   *
   * @default "# Welcome to GraphiQL..."
   */
  defaultQuery?: string;

  /**
   * Invoked when the operation name changes. Possible triggers are:
   * - Editing the contents of the operation editor
   * - Selecting an operation for execution in a document that contains multiple
   *   operation definitions
   * @param operationName - The operation name after it has been changed.
   */
  onEditOperationName?(operationName: string): void;

  /**
   * Invoked when the state of the tabs changes. Possible triggers are:
   * - Updating any editor contents inside the currently active tab
   * - Adding a tab
   * - Switching to a different tab
   * - Closing a tab
   * @param tabState - The tab state after it has been updated.
   */
  onTabChange?(tabState: TabsState): void;

  /**
   * Headers to be set when opening a new tab.
   */
  defaultHeaders?: string;

  /**
   * Invoked when the current contents of the operation editor are copied to the
   * clipboard.
   * @param query - The content that has been copied.
   */
  onCopyQuery?: (query: string) => void;

  /**
   * Invoked when the prettify callback is invoked.
   * @param query - The current value of the operation editor.
   * @default
   * import prettier from 'prettier/standalone'
   *
   * prettier.format(query, { parser: 'graphql' })
   * @returns The formatted query.
   */
  onPrettifyQuery: (query: string) => MaybePromise<string>;

  // Operation facts that are derived from the operation editor.

  /**
   * @remarks from graphiql 5
   */
  documentAST?: OperationFacts['documentAST'];

  /**
   * @remarks from graphiql 5
   */
  operationName?: string;

  /**
   * @remarks from graphiql 5
   */
  operations?: OperationFacts['operations'];
}

export interface EditorActions {
  /**
   * Add a new tab.
   */
  addTab(): void;

  /**
   * Switch to a different tab.
   * @param index - The index of the tab that should be switched to.
   */
  changeTab(index: number): void;

  /**
   * Move a tab to a new spot.
   * @param newOrder - The new order for the tabs.
   */
  moveTab(newOrder: TabState[]): void;

  /**
   * Close a tab. If the currently active tab is closed, the tab before it will
   * become active. If there is no tab before the closed one, the tab after it
   * will become active.
   * @param index - The index of the tab that should be closed.
   */
  closeTab(index: number): void;

  /**
   * Update the state for the tab that is currently active. This will be
   * reflected in the `tabs` object and the state will be persisted in storage
   * (if available).
   * @param partialTab - A partial tab state object that will override the
   * current values. The properties `id`, `hash` and `title` cannot be changed.
   */
  updateActiveTabValues(
    partialTab: Partial<Omit<TabState, 'id' | 'hash' | 'title'>>,
  ): void;

  /**
   * Set the Monaco Editor instance used in the specified editor.
   */
  setEditor(
    state: Pick<
      EditorSlice,
      'headerEditor' | 'queryEditor' | 'responseEditor' | 'variableEditor'
    >,
  ): void;

  /**
   * Changes the operation name and invokes the `onEditOperationName` callback.
   */
  setOperationName(operationName: string): void;

  /**
   * Changes if headers should be persisted.
   */
  setShouldPersistHeaders(persist: boolean): void;

  storeTabs(tabsState: TabsState): void;

  setOperationFacts(facts: {
    documentAST?: DocumentNode;
    operationName?: string;
    operations?: OperationDefinitionNode[];
  }): void;

  /**
   * Copy a query to clipboard.
   */
  copyQuery: () => Promise<void>;

  /**
   * Merge fragments definitions into operation definition.
   */
  mergeQuery: () => void;

  /**
   * Prettify query, variables and request headers editors.
   */
  prettifyEditors: () => Promise<void>;
}

export interface EditorProps
  extends Pick<
    EditorSlice,
    | 'onTabChange'
    | 'onEditOperationName'
    | 'defaultHeaders'
    | 'defaultQuery'
    | 'onCopyQuery'
  > {
  /**
   * With this prop you can pass so-called "external" fragments that will be
   * included in the query document (depending on usage). You can either pass
   * the fragments using SDL (passing a string) or you can pass a list of
   * `FragmentDefinitionNode` objects.
   */
  externalFragments?: string | FragmentDefinitionNode[];

  /**
   * This prop can be used to define the default set of tabs, with their
   * queries, variables, and headers. It will be used as default only if
   * there is no tab state persisted in storage.
   *
   * @example
   * ```tsx
   * <GraphiQL
   *   defaultTabs={[
   *     { query: 'query myExampleQuery {}' },
   *     { query: '{ id }' }
   *   ]}
   * />
   *```
   */
  defaultTabs?: TabDefinition[];

  /**
   * This prop toggles if the contents of the request headers editor are persisted in
   * storage.
   * @default false
   */
  shouldPersistHeaders?: boolean;

  onPrettifyQuery?: EditorSlice['onPrettifyQuery'];
  initialQuery?: EditorSlice['initialQuery'];
  initialVariables?: EditorSlice['initialVariables'];
  initialHeaders?: EditorSlice['initialHeaders'];
}

type CreateEditorSlice = (
  initial: Pick<
    EditorSlice,
    | 'shouldPersistHeaders'
    | 'tabs'
    | 'activeTabIndex'
    | 'initialQuery'
    | 'initialVariables'
    | 'initialHeaders'
    | 'onEditOperationName'
    | 'externalFragments'
    | 'onTabChange'
    | 'defaultQuery'
    | 'defaultHeaders'
    | 'onPrettifyQuery'
    | 'onCopyQuery'
    | 'uriInstanceId'
  >,
) => StateCreator<
  SlicesWithActions,
  [],
  [],
  EditorSlice & { actions: EditorActions }
>;

export const createEditorSlice: CreateEditorSlice = initial => (set, get) => {
  function setEditorValues({
    query,
    variables,
    headers,
    response,
  }: {
    query: string | null;
    variables?: string | null;
    headers?: string | null;
    response: string | null;
  }) {
    const {
      queryEditor,
      variableEditor,
      headerEditor,
      responseEditor,
      defaultHeaders,
    } = get();
    queryEditor?.setValue(query ?? '');
    variableEditor?.setValue(variables ?? '');
    headerEditor?.setValue(headers ?? defaultHeaders ?? '');
    responseEditor?.setValue(response ?? '');
  }

  function synchronizeActiveTabValues(tabsState: TabsState): TabsState {
    const {
      queryEditor,
      variableEditor,
      headerEditor,
      responseEditor,
      operationName,
    } = get();
    return setPropertiesInActiveTab(tabsState, {
      query: queryEditor?.getValue() ?? null,
      variables: variableEditor?.getValue() ?? null,
      headers: headerEditor?.getValue() ?? null,
      response: responseEditor?.getValue() ?? null,
      operationName: operationName ?? null,
    });
  }

  const $actions: EditorActions = {
    addTab() {
      set(({ defaultHeaders, onTabChange, tabs, activeTabIndex, actions }) => {
        // Make sure the current tab stores the latest values
        const updatedValues = synchronizeActiveTabValues({
          tabs,
          activeTabIndex,
        });
        const updated = {
          tabs: [...updatedValues.tabs, createTab({ headers: defaultHeaders })],
          activeTabIndex: updatedValues.tabs.length,
        };
        actions.storeTabs(updated);
        setEditorValues(updated.tabs[updated.activeTabIndex]!);
        onTabChange?.(updated);
        return updated;
      });
    },
    changeTab(index) {
      set(({ actions, onTabChange, tabs }) => {
        actions.stop();
        const updated = {
          tabs,
          activeTabIndex: index,
        };
        actions.storeTabs(updated);
        setEditorValues(updated.tabs[updated.activeTabIndex]!);
        onTabChange?.(updated);
        return updated;
      });
    },
    moveTab(newOrder) {
      set(({ onTabChange, actions, tabs, activeTabIndex }) => {
        const activeTab = tabs[activeTabIndex]!;
        const updated = {
          tabs: newOrder,
          activeTabIndex: newOrder.indexOf(activeTab),
        };
        actions.storeTabs(updated);
        setEditorValues(updated.tabs[updated.activeTabIndex]!);
        onTabChange?.(updated);
        return updated;
      });
    },
    closeTab(index) {
      set(({ activeTabIndex, onTabChange, actions, tabs }) => {
        if (activeTabIndex === index) {
          actions.stop();
        }
        const updated = {
          tabs: tabs.filter((_tab, i) => index !== i),
          activeTabIndex: Math.max(activeTabIndex - 1, 0),
        };
        actions.storeTabs(updated);
        setEditorValues(updated.tabs[updated.activeTabIndex]!);
        onTabChange?.(updated);
        return updated;
      });
    },
    updateActiveTabValues(partialTab) {
      set(({ activeTabIndex, tabs, onTabChange, actions }) => {
        const updated = setPropertiesInActiveTab(
          { tabs, activeTabIndex },
          partialTab,
        );
        actions.storeTabs(updated);
        onTabChange?.(updated);
        return updated;
      });
    },
    setEditor({ headerEditor, queryEditor, responseEditor, variableEditor }) {
      const entries = Object.entries({
        headerEditor,
        queryEditor,
        responseEditor,
        variableEditor,
      }).filter(([_key, value]) => value);
      const newState = Object.fromEntries(entries);
      set(newState);
    },
    setOperationName(operationName) {
      set(({ onEditOperationName, actions }) => {
        actions.updateActiveTabValues({ operationName });
        onEditOperationName?.(operationName);
        return { operationName };
      });
    },
    setShouldPersistHeaders(persist) {
      const { headerEditor, tabs, activeTabIndex, storage } = get();
      if (persist) {
        storage.set(STORAGE_KEY.headers, headerEditor?.getValue() ?? '');
        const serializedTabs = serializeTabState(
          { tabs, activeTabIndex },
          true,
        );
        storage.set(STORAGE_KEY.tabs, serializedTabs);
      } else {
        storage.set(STORAGE_KEY.headers, '');
        clearHeadersFromTabs(storage);
      }
      storage.set(STORAGE_KEY.persistHeaders, persist.toString());
      set({ shouldPersistHeaders: persist });
    },
    storeTabs({ tabs, activeTabIndex }) {
      const { shouldPersistHeaders, storage } = get();
      const store = debounce(500, (value: string) => {
        storage.set(STORAGE_KEY.tabs, value);
      });
      store(serializeTabState({ tabs, activeTabIndex }, shouldPersistHeaders));
    },
    setOperationFacts({ documentAST, operationName, operations }) {
      set({
        documentAST,
        operationName,
        operations,
      });
    },
    async copyQuery() {
      const { queryEditor, onCopyQuery } = get();
      if (!queryEditor) {
        return;
      }

      const query = queryEditor.getValue();
      onCopyQuery?.(query);
      try {
        await navigator.clipboard.writeText(query);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to copy query!', error);
      }
    },
    async prettifyEditors() {
      const { queryEditor, headerEditor, variableEditor, onPrettifyQuery } =
        get();

      if (variableEditor) {
        try {
          const content = variableEditor.getValue();
          const formatted = await formatJSONC(content);
          if (formatted !== content) {
            variableEditor.setValue(formatted);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(
            'Parsing variables JSON failed, skip prettification.',
            error,
          );
        }
      }

      if (headerEditor) {
        try {
          const content = headerEditor.getValue();
          const formatted = await formatJSONC(content);
          if (formatted !== content) {
            headerEditor.setValue(formatted);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(
            'Parsing headers JSON failed, skip prettification.',
            error,
          );
        }
      }

      if (!queryEditor) {
        return;
      }
      try {
        const content = queryEditor.getValue();
        const formatted = await onPrettifyQuery(content);
        if (formatted !== content) {
          queryEditor.setValue(formatted);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Parsing query failed, skip prettification.', error);
      }
    },
    mergeQuery() {
      const { queryEditor, documentAST, schema } = get();
      const query = queryEditor?.getValue();
      if (!documentAST || !query) {
        return;
      }
      queryEditor!.setValue(print(mergeAst(documentAST, schema)));
    },
  };
  return {
    ...initial,
    actions: $actions,
  };
};
