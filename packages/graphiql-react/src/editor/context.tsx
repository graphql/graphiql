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

export type EditorContextType = {
  activeTabIndex: number;
  tabs: TabState[];
  addTab(): void;
  changeTab(index: number): void;
  closeTab(index: number): void;
  updateActiveTabValues(
    partialTab: Partial<Omit<TabState, 'id' | 'hash' | 'title'>>,
  ): void;

  headerEditor: CodeMirrorEditor | null;
  queryEditor: CodeMirrorEditorWithOperationFacts | null;
  responseEditor: CodeMirrorEditor | null;
  variableEditor: CodeMirrorEditor | null;
  setHeaderEditor(newEditor: CodeMirrorEditor): void;
  setQueryEditor(newEditor: CodeMirrorEditorWithOperationFacts): void;
  setResponseEditor(newEditor: CodeMirrorEditor): void;
  setVariableEditor(newEditor: CodeMirrorEditor): void;

  setOperationName(operationName: string): void;

  initialHeaders: string;
  initialQuery: string;
  initialResponse: string;
  initialVariables: string;

  externalFragments: Map<string, FragmentDefinitionNode>;
  validationRules: ValidationRule[];

  shouldPersistHeaders: boolean;
};

export const EditorContext =
  createNullableContext<EditorContextType>('EditorContext');

type EditorContextProviderProps = {
  children: ReactNode;
  defaultQuery?: string;
  externalFragments?: string | FragmentDefinitionNode[];
  headers?: string;
  onEditOperationName?(operationName: string): void;
  onTabChange?(tabs: TabsState): void;
  query?: string;
  response?: string;
  shouldPersistHeaders?: boolean;
  validationRules?: ValidationRule[];
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
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#     Merge Query:  Shift-Ctrl-M (or press the merge button above)
#
#       Run Query:  Ctrl-Enter (or press the play button above)
#
#   Auto Complete:  Ctrl-Space (or just start typing)
#

`;
