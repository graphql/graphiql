import {
  DocumentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  parse,
  ValidationRule,
  visit,
} from 'graphql';
import { VariableToType } from 'graphql-language-service';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { useStorageContext } from '../storage';
import { createContextHook, createNullableContext } from '../utility/context';
import { STORAGE_KEY as STORAGE_KEY_HEADERS } from './header-editor';
import { useSynchronizeValue } from './hooks';
import { STORAGE_KEY_QUERY } from './query-editor';
import {
  emptyTab,
  getDefaultTabState,
  setPropertiesInActiveTab,
  TabsState,
  TabState,
  useSetEditorValues,
  useStoreTabs,
  useSynchronizeActiveTabValues,
} from './tabs';
import { CodeMirrorEditor } from './types';
import { STORAGE_KEY as STORAGE_KEY_VARIABLES } from './variable-editor';

export type CodeMirrorEditorWithOperationFacts = CodeMirrorEditor & {
  documentAST: DocumentNode | null;
  operationName: string | null;
  operations: OperationDefinitionNode[] | null;
  variableToType: VariableToType | null;
};

export type EditorContextType = TabsState & {
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
   * Close a tab. If the currently active tab is closed the tab before it will
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
};

export const EditorContext =
  createNullableContext<EditorContextType>('EditorContext');

export type EditorContextProviderProps = {
  children: ReactNode;
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
   * Invoked when the operation name changes. Possible triggers are:
   * - Editing the contents of the query editor
   * - Selecting a operation for execution in a document that contains multiple
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
   * @param tabState The tabs state after it has been updated.
   */
  onTabChange?(tabState: TabsState): void;
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
};

export function EditorContextProvider(props: EditorContextProviderProps) {
  const storage = useStorageContext();
  const [headerEditor, setHeaderEditor] = useState<CodeMirrorEditor | null>(
    null,
  );
  const [queryEditor, setQueryEditor] =
    useState<CodeMirrorEditorWithOperationFacts | null>(null);
  const [responseEditor, setResponseEditor] = useState<CodeMirrorEditor | null>(
    null,
  );
  const [variableEditor, setVariableEditor] = useState<CodeMirrorEditor | null>(
    null,
  );

  useSynchronizeValue(headerEditor, props.headers);
  useSynchronizeValue(queryEditor, props.query);
  useSynchronizeValue(responseEditor, props.response);
  useSynchronizeValue(variableEditor, props.variables);

  // We store this in state but never update it. By passing a function we only
  // need to compute it lazily during the initial render.
  const [storedEditorValues] = useState(() => ({
    headers: props.headers ?? storage?.get(STORAGE_KEY_HEADERS) ?? null,
    query: props.query ?? storage?.get(STORAGE_KEY_QUERY) ?? null,
    variables: props.variables ?? storage?.get(STORAGE_KEY_VARIABLES) ?? null,
  }));

  const [tabState, setTabState] = useState<TabsState>(() =>
    getDefaultTabState({ ...storedEditorValues, storage }),
  );

  const storeTabs = useStoreTabs({
    storage,
    shouldPersistHeaders: props.shouldPersistHeaders,
  });
  const synchronizeActiveTabValues = useSynchronizeActiveTabValues({
    queryEditor,
    variableEditor,
    headerEditor,
    responseEditor,
  });
  const setEditorValues = useSetEditorValues({
    queryEditor,
    variableEditor,
    headerEditor,
    responseEditor,
  });
  const { onTabChange } = props;

  const addTab = useCallback<EditorContextType['addTab']>(() => {
    setTabState(current => {
      // Make sure the current tab stores the latest values
      const updatedValues = synchronizeActiveTabValues(current);
      const updated = {
        tabs: [...updatedValues.tabs, emptyTab()],
        activeTabIndex: updatedValues.tabs.length,
      };
      storeTabs(updated);
      setEditorValues(updated.tabs[updated.activeTabIndex]);
      onTabChange?.(updated);
      return updated;
    });
  }, [onTabChange, setEditorValues, storeTabs, synchronizeActiveTabValues]);

  const changeTab = useCallback<EditorContextType['changeTab']>(
    index => {
      setTabState(current => {
        const updated = {
          ...synchronizeActiveTabValues(current),
          activeTabIndex: index,
        };
        storeTabs(updated);
        setEditorValues(updated.tabs[updated.activeTabIndex]);
        onTabChange?.(updated);
        return updated;
      });
    },
    [onTabChange, setEditorValues, storeTabs, synchronizeActiveTabValues],
  );

  const closeTab = useCallback<EditorContextType['closeTab']>(
    index => {
      setTabState(current => {
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
    [onTabChange, setEditorValues, storeTabs],
  );

  const updateActiveTabValues = useCallback<
    EditorContextType['updateActiveTabValues']
  >(
    partialTab => {
      setTabState(current => {
        const updated = setPropertiesInActiveTab(current, partialTab);
        storeTabs(updated);
        onTabChange?.(updated);
        return updated;
      });
    },
    [onTabChange, storeTabs],
  );

  const { onEditOperationName } = props;
  const setOperationName = useCallback<EditorContextType['setOperationName']>(
    operationName => {
      if (!queryEditor) {
        return;
      }

      queryEditor.operationName = operationName;
      updateActiveTabValues({ operationName });
      onEditOperationName?.(operationName);
    },
    [onEditOperationName, queryEditor, updateActiveTabValues],
  );

  const defaultQuery =
    tabState.activeTabIndex > 0 ? '' : props.defaultQuery ?? DEFAULT_QUERY;
  const initialValues = useRef({
    initialHeaders: storedEditorValues.headers ?? '',
    initialQuery: storedEditorValues.query ?? defaultQuery,
    initialResponse: props.response ?? '',
    initialVariables: storedEditorValues.variables ?? '',
  });

  const externalFragments = useMemo(() => {
    const map = new Map<string, FragmentDefinitionNode>();
    if (Array.isArray(props.externalFragments)) {
      for (const fragment of props.externalFragments) {
        map.set(fragment.name.value, fragment);
      }
    } else if (typeof props.externalFragments === 'string') {
      visit(parse(props.externalFragments, {}), {
        FragmentDefinition(fragment) {
          map.set(fragment.name.value, fragment);
        },
      });
    } else if (props.externalFragments) {
      throw new Error(
        'The `externalFragments` prop must either be a string that contains the fragment definitions in SDL or a list of FragmentDefinitionNode objects.',
      );
    }
    return map;
  }, [props.externalFragments]);

  const validationRules = useMemo(
    () => props.validationRules || [],
    [props.validationRules],
  );

  const value = useMemo<EditorContextType>(
    () => ({
      ...tabState,
      addTab,
      changeTab,
      closeTab,
      updateActiveTabValues,

      headerEditor,
      queryEditor,
      responseEditor,
      variableEditor,
      setHeaderEditor,
      setQueryEditor,
      setResponseEditor,
      setVariableEditor,

      setOperationName,

      ...initialValues.current,

      externalFragments,
      validationRules,

      shouldPersistHeaders: props.shouldPersistHeaders || false,
    }),
    [
      tabState,
      addTab,
      changeTab,
      closeTab,
      updateActiveTabValues,

      headerEditor,
      queryEditor,
      responseEditor,
      variableEditor,

      setOperationName,

      externalFragments,
      validationRules,

      props.shouldPersistHeaders,
    ],
  );

  return (
    <EditorContext.Provider value={value}>
      {props.children}
    </EditorContext.Provider>
  );
}

export const useEditorContext = createContextHook(EditorContext);

const DEFAULT_QUERY = `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#   Prettify query:  Shift-Ctrl-P (or press the prettify button)
#
#  Merge fragments:  Shift-Ctrl-M (or press the merge button)
#
#        Run Query:  Ctrl-Enter (or press the play button)
#
#    Auto Complete:  Ctrl-Space (or just start typing)
#

`;
