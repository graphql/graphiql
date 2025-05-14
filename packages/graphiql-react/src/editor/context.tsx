// eslint-disable-next-line react/jsx-filename-extension -- TODO
import {
  DocumentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  parse,
  ValidationRule,
  visit,
  print,
} from 'graphql';
import { VariableToType } from 'graphql-language-service';
import { FC, ReactElement, ReactNode, useEffect, useRef } from 'react';
import { MaybePromise } from '@graphiql/toolkit';

import { storageStore, useStorage } from '../storage';
import { STORAGE_KEY as STORAGE_KEY_HEADERS } from './header-editor';
import { useSynchronizeValue } from './hooks';
import { STORAGE_KEY_QUERY } from './query-editor';
import {
  createTab,
  getDefaultTabState,
  setPropertiesInActiveTab,
  TabDefinition,
  TabsState,
  TabState,
  setEditorValues,
  storeTabs,
  synchronizeActiveTabValues,
  clearHeadersFromTabs,
  serializeTabState,
  STORAGE_KEY as STORAGE_KEY_TABS,
} from './tabs';
import { CodeMirrorEditor } from './types';
import { STORAGE_KEY as STORAGE_KEY_VARIABLES } from './variable-editor';
import { DEFAULT_QUERY } from '../constants';
import { createStore } from 'zustand';
import { createBoundedUseStore } from '../utility';

export type CodeMirrorEditorWithOperationFacts = CodeMirrorEditor & {
  documentAST: DocumentNode | null;
  operationName: string | null;
  operations: OperationDefinitionNode[] | null;
  variableToType: VariableToType | null;
};

interface EditorStore extends TabsState {
  /**
   * Add a new tab.
   */
  addTab(): void;

  /**
   * Switch to a different tab.
   * @param index The index of the tab that should be switched to.
   */
  changeTab(index: number): void;

  /**
   * Move a tab to a new spot.
   * @param newOrder The new order for the tabs.
   */
  moveTab(newOrder: TabState[]): void;

  /**
   * Close a tab. If the currently active tab is closed, the tab before it will
   * become active. If there is no tab before the closed one, the tab after it
   * will become active.
   * @param index The index of the tab that should be closed.
   */
  closeTab(index: number): void;

  /**
   * Update the state for the tab that is currently active. This will be
   * reflected in the `tabs` object and the state will be persisted in storage
   * (if available).
   * @param partialTab A partial tab state object that will override the
   * current values. The properties `id`, `hash` and `title` cannot be changed.
   */
  updateActiveTabValues(
    partialTab: Partial<Omit<TabState, 'id' | 'hash' | 'title'>>,
  ): void;

  /**
   * The CodeMirror editor instance for the headers editor.
   */
  headerEditor: CodeMirrorEditor | null;
  /**
   * The CodeMirror editor instance for the query editor. This editor also
   * stores the operation facts that are derived from the current editor
   * contents.
   */
  queryEditor: CodeMirrorEditorWithOperationFacts | null;
  /**
   * The CodeMirror editor instance for the response editor.
   */
  responseEditor: CodeMirrorEditor | null;
  /**
   * The CodeMirror editor instance for the variables editor.
   */
  variableEditor: CodeMirrorEditor | null;

  /**
   * Set the CodeMirror editor instance for the headers editor.
   */
  setHeaderEditor(newEditor: CodeMirrorEditor): void;

  /**
   * Set the CodeMirror editor instance for the query editor.
   */
  setQueryEditor(newEditor: CodeMirrorEditorWithOperationFacts): void;

  /**
   * Set the CodeMirror editor instance for the response editor.
   */
  setResponseEditor(newEditor: CodeMirrorEditor): void;

  /**
   * Set the CodeMirror editor instance for the variables editor.
   */
  setVariableEditor(newEditor: CodeMirrorEditor): void;

  /**
   * Changes the operation name and invokes the `onEditOperationName` callback.
   */
  setOperationName(operationName: string): void;

  /**
   * The contents of the headers editor when initially rendering the provider
   * component.
   */

  initialHeaders: string;
  /**
   * The contents of the query editor when initially rendering the provider
   * component.
   */

  initialQuery: string;
  /**
   * The contents of the response editor when initially rendering the provider
   * component.
   */

  initialResponse: string;
  /**
   * The contents of the variables editor when initially rendering the provider
   * component.
   */

  initialVariables: string;

  /**
   * A map of fragment definitions using the fragment name as key which are
   * made available to include in the query.
   */
  externalFragments: Map<string, FragmentDefinitionNode>;

  /**
   * If the contents of the headers editor are persisted in storage.
   */
  shouldPersistHeaders: boolean;

  /**
   * Changes if headers should be persisted.
   */
  setShouldPersistHeaders(persist: boolean): void;

  /**
   * The initial contents of the query editor when loading GraphiQL and there
   * is no other source for the editor state. Other sources can be:
   * - The `query` prop
   * - The value persisted in storage
   * These default contents will only be used for the first tab. When opening
   * more tabs the query editor will start out empty.
   */
  defaultQuery?: string;

  /**
   * Invoked when the operation name changes. Possible triggers are:
   * - Editing the contents of the query editor
   * - Selecting an operation for execution in a document that contains multiple
   *   operation definitions
   * @param operationName The operation name after it has been changed.
   */
  onEditOperationName?(operationName: string): void;

  /**
   * Invoked when the state of the tabs changes. Possible triggers are:
   * - Updating any editor contents inside the currently active tab
   * - Adding a tab
   * - Switching to a different tab
   * - Closing a tab
   * @param tabState The tab state after it has been updated.
   */
  onTabChange?(tabState: TabsState): void;

  /**
   * A list of custom validation rules that are run in addition to the rules
   * provided by the GraphQL spec.
   */
  validationRules: ValidationRule[];

  /**
   * Headers to be set when opening a new tab
   */
  defaultHeaders?: string;

  /**
   * Invoked when the current contents of the query editor are copied to the
   * clipboard.
   * @param query The content that has been copied.
   */
  onCopyQuery?: (query: string) => void;

  /**
   * Invoked when the prettify callback is invoked.
   * @param query The current value of the query editor.
   * @default
   * import { parse, print } from 'graphql'
   *
   * (query) => print(parse(query))
   * @returns The formatted query.
   */
  onPrettifyQuery: (query: string) => MaybePromise<string>;
}

type EditorContextProviderProps = Pick<
  EditorStore,
  | 'onTabChange'
  | 'onEditOperationName'
  | 'defaultHeaders'
  | 'defaultQuery'
  | 'onCopyQuery'
> & {
  children: ReactNode;
  /**
   * With this prop you can pass so-called "external" fragments that will be
   * included in the query document (depending on usage). You can either pass
   * the fragments using SDL (passing a string) or you can pass a list of
   * `FragmentDefinitionNode` objects.
   */
  externalFragments?: string | FragmentDefinitionNode[];
  /**
   * This prop can be used to set the contents of the headers editor. Every
   * time this prop changes, the contents of the headers editor are replaced.
   * Note that the editor contents can be changed in between these updates by
   * typing in the editor.
   */
  headers?: string;
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
   * This prop can be used to set the contents of the query editor. Every time
   * this prop changes, the contents of the query editor are replaced. Note
   * that the editor contents can be changed in between these updates by typing
   * in the editor.
   */
  query?: string;
  /**
   * This prop can be used to set the contents of the response editor. Every
   * time this prop changes, the contents of the response editor are replaced.
   * Note that the editor contents can change in between these updates by
   * executing queries that will show a response.
   */
  response?: string;
  /**
   * This prop toggles if the contents of the headers editor are persisted in
   * storage.
   * @default false
   */
  shouldPersistHeaders?: boolean;
  /**
   * This prop accepts custom validation rules for GraphQL documents that are
   * run against the contents of the query editor (in addition to the rules
   * that are specified in the GraphQL spec).
   */
  validationRules?: ValidationRule[];
  /**
   * This prop can be used to set the contents of the variables editor. Every
   * time this prop changes, the contents of the variables editor are replaced.
   * Note that the editor contents can be changed in between these updates by
   * typing in the editor.
   */
  variables?: string;
  onPrettifyQuery?: EditorStore['onPrettifyQuery'];
};

export const editorStore = createStore<EditorStore>((set, get) => ({
  tabs: null!,
  activeTabIndex: null!,
  addTab() {
    set(current => {
      const { defaultQuery, defaultHeaders, onTabChange } = get();

      // Make sure the current tab stores the latest values
      const updatedValues = synchronizeActiveTabValues(current);
      const updated = {
        tabs: [
          ...updatedValues.tabs,
          createTab({
            headers: defaultHeaders,
            query: defaultQuery,
          }),
        ],
        activeTabIndex: updatedValues.tabs.length,
      };
      storeTabs(updated);
      setEditorValues(updated.tabs[updated.activeTabIndex]);
      onTabChange?.(updated);
      return updated;
    });
  },
  changeTab(index) {
    set(current => {
      const { onTabChange } = get();
      const updated = {
        ...current,
        activeTabIndex: index,
      };
      storeTabs(updated);
      setEditorValues(updated.tabs[updated.activeTabIndex]);
      onTabChange?.(updated);
      return updated;
    });
  },
  moveTab(newOrder) {
    set(current => {
      const { onTabChange } = get();
      const activeTab = current.tabs[current.activeTabIndex];
      const updated = {
        tabs: newOrder,
        activeTabIndex: newOrder.indexOf(activeTab),
      };
      storeTabs(updated);
      setEditorValues(updated.tabs[updated.activeTabIndex]);
      onTabChange?.(updated);
      return updated;
    });
  },
  closeTab(index) {
    set(current => {
      const { onTabChange } = get();
      const updated = {
        tabs: current.tabs.filter((_tab, i) => index !== i),
        activeTabIndex: Math.max(current.activeTabIndex - 1, 0),
      };
      storeTabs(updated);
      setEditorValues(updated.tabs[updated.activeTabIndex]);
      onTabChange?.(updated);
      return updated;
    });
  },
  updateActiveTabValues(partialTab) {
    set(current => {
      if (!current.tabs) {
        // Vitest fails with TypeError: Cannot read properties of null (reading 'map')
        // in `setPropertiesInActiveTab` when `tabs` is `null`
        return current;
      }
      const { onTabChange } = get();
      const updated = setPropertiesInActiveTab(current, partialTab);
      storeTabs(updated);
      onTabChange?.(updated);
      return updated;
    });
  },
  headerEditor: null!,
  queryEditor: null!,
  responseEditor: null!,
  variableEditor: null!,
  setHeaderEditor(headerEditor) {
    set({ headerEditor });
  },
  setQueryEditor(queryEditor) {
    set({ queryEditor });
  },
  setResponseEditor(responseEditor) {
    set({ responseEditor });
  },
  setVariableEditor(variableEditor) {
    set({ variableEditor });
  },
  setOperationName(operationName) {
    const { queryEditor, onEditOperationName, updateActiveTabValues } = get();
    if (!queryEditor) {
      return;
    }
    queryEditor.operationName = operationName;
    updateActiveTabValues({ operationName });
    onEditOperationName?.(operationName);
  },
  shouldPersistHeaders: false,
  setShouldPersistHeaders(persist) {
    const { headerEditor, tabs, activeTabIndex } = get();
    const { storage } = storageStore.getState();
    if (persist) {
      storage.set(STORAGE_KEY_HEADERS, headerEditor?.getValue() ?? '');
      const serializedTabs = serializeTabState({ tabs, activeTabIndex }, true);
      storage.set(STORAGE_KEY_TABS, serializedTabs);
    } else {
      storage.set(STORAGE_KEY_HEADERS, '');
      clearHeadersFromTabs();
    }
    set({ shouldPersistHeaders: persist });
    storage.set(PERSIST_HEADERS_STORAGE_KEY, persist.toString());
  },
  onEditOperationName: undefined,
  externalFragments: null!,
  onTabChange: undefined,
  defaultQuery: undefined,
  defaultHeaders: undefined,
  validationRules: null!,
  initialHeaders: null!,
  initialQuery: null!,
  initialResponse: null!,
  initialVariables: null!,
  onPrettifyQuery: DEFAULT_PRETTIFY_QUERY,
}));

const DEFAULT_PRETTIFY_QUERY: EditorStore['onPrettifyQuery'] = query =>
  print(parse(query));

export const EditorContextProvider: FC<EditorContextProviderProps> = ({
  externalFragments,
  onEditOperationName,
  defaultHeaders,
  onTabChange,
  defaultQuery,
  children,
  shouldPersistHeaders = false,
  validationRules = [],
  onCopyQuery,
  onPrettifyQuery = DEFAULT_PRETTIFY_QUERY,
  ...props
}) => {
  const storage = useStorage();
  const isMounted = useEditorStore(store => Boolean(store.tabs));

  const headerEditor = useEditorStore(store => store.headerEditor);
  const queryEditor = useEditorStore(store => store.queryEditor);
  const responseEditor = useEditorStore(store => store.responseEditor);
  const variableEditor = useEditorStore(store => store.variableEditor);

  useSynchronizeValue(headerEditor, props.headers);
  useSynchronizeValue(queryEditor, props.query);
  useSynchronizeValue(responseEditor, props.response);
  useSynchronizeValue(variableEditor, props.variables);

  // TODO:
  // const lastShouldPersistHeadersProp = useRef<boolean | undefined>(undefined);
  // useEffect(() => {
  //   const propValue = shouldPersistHeaders;
  //   if (lastShouldPersistHeadersProp.current !== propValue) {
  //     editorStore.getState().setShouldPersistHeaders(propValue);
  //     lastShouldPersistHeadersProp.current = propValue;
  //   }
  // }, [shouldPersistHeaders]);

  const $externalFragments = (() => {
    const map = new Map<string, FragmentDefinitionNode>();
    if (Array.isArray(externalFragments)) {
      for (const fragment of externalFragments) {
        map.set(fragment.name.value, fragment);
      }
    } else if (typeof externalFragments === 'string') {
      visit(parse(externalFragments, {}), {
        FragmentDefinition(fragment) {
          map.set(fragment.name.value, fragment);
        },
      });
    } else if (externalFragments) {
      throw new Error(
        'The `externalFragments` prop must either be a string that contains the fragment definitions in SDL or a list of FragmentDefinitionNode objects.',
      );
    }
    return map;
  })();

  const initialRendered = useRef(false);

  useEffect(() => {
    if (initialRendered.current) {
      return;
    }
    initialRendered.current = true;

    // We only need to compute it lazily during the initial render.
    const query = props.query ?? storage.get(STORAGE_KEY_QUERY) ?? null;
    const variables =
      props.variables ?? storage.get(STORAGE_KEY_VARIABLES) ?? null;
    const headers = props.headers ?? storage.get(STORAGE_KEY_HEADERS) ?? null;
    const response = props.response ?? '';

    const tabState = getDefaultTabState({
      query,
      variables,
      headers,
      defaultTabs: props.defaultTabs,
      defaultQuery: defaultQuery || DEFAULT_QUERY,
      defaultHeaders,
      shouldPersistHeaders,
    });
    storeTabs(tabState);

    const isStored = storage.get(PERSIST_HEADERS_STORAGE_KEY) !== null;

    const $shouldPersistHeaders =
      shouldPersistHeaders !== false && isStored
        ? storage.get(PERSIST_HEADERS_STORAGE_KEY) === 'true'
        : shouldPersistHeaders;

    editorStore.setState({
      shouldPersistHeaders: $shouldPersistHeaders,
      ...tabState,
      initialQuery:
        query ??
        (tabState.activeTabIndex === 0 ? tabState.tabs[0].query : null) ??
        '',
      initialVariables: variables ?? '',
      initialHeaders: headers ?? defaultHeaders ?? '',
      initialResponse: response,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  useEffect(() => {
    editorStore.setState({
      externalFragments: $externalFragments,
      onTabChange,
      onEditOperationName,
      defaultQuery,
      defaultHeaders,
      validationRules,
      onCopyQuery,
      onPrettifyQuery,
    });
  }, [
    $externalFragments,
    onTabChange,
    onEditOperationName,
    defaultQuery,
    defaultHeaders,
    validationRules,
    onCopyQuery,
    onPrettifyQuery,
  ]);

  if (!isMounted) {
    // Ensure store was initialized
    return null;
  }
  return children as ReactElement;
};

export const useEditorStore = createBoundedUseStore(editorStore);

const PERSIST_HEADERS_STORAGE_KEY = 'shouldPersistHeaders';
