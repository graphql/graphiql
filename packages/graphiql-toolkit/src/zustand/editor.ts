import { synchronizeActiveTabValues, TabState } from './tabs';

import { DocumentNode, OperationDefinitionNode } from 'graphql';
import { VariableToType } from 'graphql-language-service';

import {
  createTab,
  getDefaultTabState,
  setPropertiesInActiveTab,
  TabsState,
} from './tabs';

import { CodeMirrorEditor } from '../codemirror/types';

import { GraphiQLState, ImmerStateCreator, UserOptions } from './store';
import { DEFAULT_QUERY } from '../constants';
import { produce } from 'immer';

export type CodeMirrorEditorWithOperationFacts = CodeMirrorEditor & {
  documentAST: DocumentNode | null;
  operationName: string | null;
  operations: OperationDefinitionNode[] | null;
  variableToType: VariableToType | null;
};

export type EditorState = {
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

  tabsState: TabsState;
};

export type EditorStoreActions = {
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
   * Changes if headers should be persisted.
   */
  setShouldPersistHeaders(persist: boolean): void;
  /**
   * Set the provided editor values to the cm editor state, for example, on tab change
   */
  setEditorValues: (newEditorState: {
    query: string | null;
    headers: string | null;
    variables: string | null;
    response?: string | null;
  }) => void;
  synchronizeActiveTabValues: () => void;
  setQueryValue: (query: string) => void;
  setVariablesValue: (variables: string) => void;
  setHeadersValue: (headers: string) => void;
  setResponseValue: (response: string) => void;
};

export type EditorSlice = EditorState & EditorStoreActions;

export const getDefaultEditorState = (options?: UserOptions) => ({
  headerEditor: null,
  queryEditor: null,
  responseEditor: null,
  variableEditor: null,
  initialQuery: '',
  initialResponse: '',
  initialVariables: '',
  initialHeaders: '',
  shouldPersistHeaders: false,
  tabsState: getDefaultTabState({
    defaultQuery: options?.defaultQuery ?? DEFAULT_QUERY,
    defaultHeaders: '',
    headers: null,
    query: null,
    variables: null,
    storage: null,
    shouldPersistHeaders: false,
  }),
  externalFragments: new Map(),
  validationRules: [],
});

export const editorSlice =
  (options?: UserOptions): ImmerStateCreator<EditorSlice> =>
  set => ({
    ...getDefaultEditorState(options),
    setHeaderEditor(newEditor) {
      set(
        produce((state: GraphiQLState) => {
          state.editor.headerEditor = newEditor;
        }),
      );
    },
    setQueryEditor(newEditor) {
      set(
        produce((state: GraphiQLState) => {
          state.editor.queryEditor = newEditor;
        }),
      );
    },
    setResponseEditor(newEditor) {
      set(
        produce((state: GraphiQLState) => {
          state.editor.responseEditor = newEditor;
        }),
      );
    },
    setVariableEditor(newEditor) {
      set(
        produce((state: GraphiQLState) => {
          state.editor.variableEditor = newEditor;
        }),
      );
    },
    setOperationName(operationName) {
      set(
        produce((state: GraphiQLState) => {
          if (state.editor.queryEditor) {
            state.editor.queryEditor.operationName = operationName;
          }
          state.editor.updateActiveTabValues({ operationName });
        }),
      );
    },
    setShouldPersistHeaders(persist) {
      set(
        produce((state: GraphiQLState) => {
          state.options.shouldPersistHeaders = persist;
        }),
      );
    },
    updateActiveTabValues: partialTab =>
      set(
        produce((state: GraphiQLState) => {
          const updated = setPropertiesInActiveTab(
            state.editor.tabsState,
            partialTab,
          );
          state.options.onTabChange?.(updated);
          return updated;
        }),
      ),

    addTab: () => {
      // Make sure the current tab stores the latest values
      set(
        produce((state: GraphiQLState) => {
          state.editor.synchronizeActiveTabValues();
          const { tabs } = state.editor.tabsState;
          const updated: TabsState = {
            tabs: [
              ...tabs,
              createTab({
                headers: state.options.defaultHeaders,
                query: state.options.defaultQuery ?? DEFAULT_QUERY,
              }),
            ],
            activeTabIndex: tabs.length,
          };
          state.editor.tabsState = updated;
          state.editor.setEditorValues(updated.tabs[updated.activeTabIndex]);
          state.options.onTabChange?.(updated);
        }),
      );
    },
    synchronizeActiveTabValues() {
      set(
        produce((state: GraphiQLState) => {
          const { queryEditor, variableEditor, headerEditor, responseEditor } =
            state.editor;
          state.editor.tabsState = synchronizeActiveTabValues({
            queryEditor,
            variableEditor,
            headerEditor,
            responseEditor,
            currentState: state.editor.tabsState,
          });
        }),
      );
    },
    changeTab(index) {
      set(
        produce((state: GraphiQLState) => {
          const updated = {
            ...state.editor.tabsState,
            activeTabIndex: index,
          };
          state.editor.setEditorValues(updated.tabs[updated.activeTabIndex]);
          state.editor.tabsState = updated;
          state.options.onTabChange?.(updated);
        }),
      );
    },
    moveTab(newOrder) {
      set(
        produce((state: GraphiQLState) => {
          const updated = {
            ...state.editor.tabsState,
            tabs: newOrder,
          };
          state.editor.tabsState = updated;
          state.options.onTabChange?.(updated);
        }),
      );
    },
    closeTab(index) {
      set(
        produce((state: GraphiQLState) => {
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
        }),
      );
    },

    setEditorValues(newEditorState) {
      set(
        produce((state: GraphiQLState) => {
          state.editor.tabsState = setPropertiesInActiveTab(
            state.editor.tabsState,
            newEditorState,
          );
        }),
      );
    },
    setQueryValue(query) {
      set(
        produce((state: GraphiQLState) => {
          state.editor.tabsState = setPropertiesInActiveTab(
            state.editor.tabsState,
            {
              query,
            },
          );
        }),
      );
    },
    setHeadersValue(headers) {
      set(
        produce((state: GraphiQLState) => {
          state.editor.tabsState = setPropertiesInActiveTab(
            state.editor.tabsState,
            {
              headers,
            },
          );
        }),
      );
    },
    setResponseValue(response) {
      set(
        produce((state: GraphiQLState) => {
          state.editor.tabsState = setPropertiesInActiveTab(
            state.editor.tabsState,
            {
              response,
            },
          );
        }),
      );
    },
    setVariablesValue(variables) {
      set(
        produce((state: GraphiQLState) => {
          state.editor.tabsState = setPropertiesInActiveTab(
            state.editor.tabsState,
            {
              variables,
            },
          );
        }),
      );
    },
  });
