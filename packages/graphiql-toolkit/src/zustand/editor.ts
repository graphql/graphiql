import { synchronizeActiveTabValues, TabState } from './tabs';

import {
  DocumentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  ValidationRule,
} from 'graphql';
import { VariableToType } from 'graphql-language-service';

import {
  createTab,
  getDefaultTabState,
  setPropertiesInActiveTab,
  TabDefinition,
  TabsState,
  useSetEditorValues,
  useStoreTabs,
  useSynchronizeActiveTabValues,
  clearHeadersFromTabs,
  serializeTabState,
  STORAGE_KEY as STORAGE_KEY_TABS,
} from './tabs';

import { CodeMirrorEditor } from '../codemirror/types';

import { ImmerStateCreator } from './store';

export type CodeMirrorEditorWithOperationFacts = CodeMirrorEditor & {
  documentAST: DocumentNode | null;
  operationName: string | null;
  operations: OperationDefinitionNode[] | null;
  variableToType: VariableToType | null;
};

export type EditorState = {
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
   * A list of custom validation rules that are run in addition to the rules
   * provided by the GraphQL spec.
   */
  validationRules: ValidationRule[];

  /**
   * If the contents of the headers editor are persisted in storage.
   */
  shouldPersistHeaders: boolean;
  /**
   * Changes if headers should be persisted.
   */
  setShouldPersistHeaders(persist: boolean): void;
  /**
   * Set the provided editor values to the cm editor state, for example, on tab change
   */
  setEditorValues: (newEditorState: {
    query?: string;
    headers?: string;
    variables?: string;
    response?: string;
  }) => void;

  tabsState: TabsState;
  synchronizeActiveTabValues: () => void;
};

export const editorSlice: ImmerStateCreator<EditorState> = set => ({
  headerEditor: null,
  queryEditor: null,
  responseEditor: null,
  variableEditor: null,
  initialQuery: '',
  initialResponse: '',
  initialVariables: '',
  shouldPersistHeaders: false,
  tabs: [],
  tabsState: getDefaultTabState({
    defaultQuery: '',
    defaultHeaders: '',
    headers: null,
    defaultTabs: [],
    query: null,
    variables: null,
    storage: null,
    shouldPersistHeaders: false,
  }),
  setHeaderEditor(newEditor) {
    set(state => {
      state.editor.headerEditor = newEditor;
    });
  },
  setQueryEditor(newEditor) {
    set(state => {
      state.editor.queryEditor = newEditor;
    });
  },
  setResponseEditor(newEditor) {
    set(state => {
      state.editor.responseEditor = newEditor;
    });
  },
  setVariableEditor(newEditor) {
    set(state => {
      state.editor.variableEditor = newEditor;
    });
  },
  setOperationName(operationName) {
    set(state => {
      if (state.editor.queryEditor) {
        state.editor.queryEditor.operationName = operationName;
      }
      state.editor.updateActiveTabValues({ operationName });
    });
  },
  setShouldPersistHeaders(persist) {
    set(state => {
      state.editor.shouldPersistHeaders = persist;
    });
  },
  updateActiveTabValues: partialTab =>
    set(state => {
      const updated = setPropertiesInActiveTab(
        state.editor.tabsState,
        partialTab,
      );
      state.options.onTabChange?.(updated);
      return updated;
    }),

  initialHeaders: '',
  addTab: () => {
    // Make sure the current tab stores the latest values

    set(state => {
      state.editor.synchronizeActiveTabValues();
      const { tabs } = state.editor.tabsState;
      const updated: TabsState = {
        tabs: [
          ...tabs,
          createTab({
            headers: defaultHeaders,
            query: defaultQuery ?? DEFAULT_QUERY,
          }),
        ],
        activeTabIndex: tabs.length,
      };
      state.editor.tabsState = updated;
      state.editor.setEditorValues(updated.tabs[updated.activeTabIndex]);
      state.options.onTabChange?.(updated);
    });
  },
  synchronizeActiveTabValues() {
    set(state => {
      state.editor.tabsState = synchronizeActiveTabValues({
        ...state.editor,
        currentState: state.editor.tabsState,
      });
    });
  },
  changeTab(index) {
    set(state => {
      const updated = {
        ...state.editor.tabsState,
        activeTabIndex: index,
      };
      state.editor.setEditorValues(updated.tabs[updated.activeTabIndex]);
      state.options.onTabChange?.(updated);
    });
  },
  moveTab(newOrder) {
    set(state => {
      const updated = {
        ...state.editor.tabsState,
        tabs: newOrder,
      };
      state.editor.tabsState = updated;
      state.options.onTabChange?.(updated);
    });
  },
  closeTab(index) {
    set(state => {
      const updated = {
        ...state.editor.tabsState,
        tabs: state.editor.tabsState.tabs.filter((_, i) => i !== index),
        activeTabIndex:
          state.editor.tabsState.activeTabIndex === index
            ? Math.max(0, index - 1)
            : state.editor.tabsState.activeTabIndex,
      };
      state.editor.tabsState = updated;
      state.editor.setEditorValues(updated.tabs[updated.activeTabIndex]);
      state.options.onTabChange?.(updated);
    });
  },

  setEditorValues(newEditorState) {
    set(state => {
      state.editor.tabsState = setPropertiesInActiveTab(
        state.editor.tabsState,
        newEditorState,
      );
    });
  },
  externalFragments: new Map(),
  validationRules: [],
});
