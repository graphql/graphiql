import { StorageAPI } from '@graphiql/toolkit';
import { useCallback, useMemo } from 'react';

import debounce from '../utility/debounce';
import { CodeMirrorEditorWithOperationFacts } from './context';
import { CodeMirrorEditor } from './types';

/**
 * This object describes the state of a single tab.
 */
export type TabState = {
  /**
   * A GUID value generated when the tab was created.
   */
  id: string;
  /**
   * A hash that is unique for a combination of the contents of the query
   * editor, the variable editor and the header editor (i.e. all the editor
   * where the contents are persisted in storage).
   */
  hash: string;
  /**
   * The title of the tab shown in the tab element.
   */
  title: string;
  /**
   * The contents of the query editor of this tab.
   */
  query: string | null;
  /**
   * The contents of the variable editor of this tab.
   */
  variables: string | null;
  /**
   * The contents of the headers editor of this tab.
   */
  headers: string | null;
  /**
   * The operation name derived from the contents of the query editor of this
   * tab.
   */
  operationName: string | null;
  /**
   * The contents of the response editor of this tab.
   */
  response: string | null;
};

/**
 * This object describes the state of all tabs.
 */
export type TabsState = {
  /**
   * A list of state objects for each tab.
   */
  tabs: TabState[];
  /**
   * The index of the currently active tab with regards to the `tabs` list of
   * this object.
   */
  activeTabIndex: number;
};

export function getDefaultTabState({
  defaultQuery,
  headers,
  query,
  variables,
  storage,
}: {
  defaultQuery: string;
  headers: string | null;
  query: string | null;
  variables: string | null;
  storage: StorageAPI | null;
}) {
  const storedState = storage?.get(STORAGE_KEY);
  try {
    if (!storedState) {
      throw new Error('Storage for tabs is empty');
    }
    const parsed = JSON.parse(storedState);
    if (isTabsState(parsed)) {
      const expectedHash = hashFromTabContents({ query, variables, headers });
      let matchingTabIndex = -1;

      for (let index = 0; index < parsed.tabs.length; index++) {
        const tab = parsed.tabs[index];
        tab.hash = hashFromTabContents({
          query: tab.query,
          variables: tab.variables,
          headers: tab.headers,
        });
        if (tab.hash === expectedHash) {
          matchingTabIndex = index;
        }
      }

      if (matchingTabIndex >= 0) {
        parsed.activeTabIndex = matchingTabIndex;
      } else {
        const operationName = query ? fuzzyExtractOperationName(query) : null;
        parsed.tabs.push({
          id: guid(),
          hash: expectedHash,
          title: operationName || DEFAULT_TITLE,
          query,
          variables,
          headers,
          operationName,
          response: null,
        });
        parsed.activeTabIndex = parsed.tabs.length - 1;
      }

      return parsed;
    } else {
      throw new Error('Storage for tabs is invalid');
    }
  } catch (err) {
    return {
      activeTabIndex: 0,
      tabs: [createTab({ query: query ?? defaultQuery, variables, headers })],
    };
  }
}

function isTabsState(obj: any): obj is TabsState {
  return (
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    hasNumberKey(obj, 'activeTabIndex') &&
    'tabs' in obj &&
    Array.isArray(obj.tabs) &&
    obj.tabs.every(isTabState)
  );
}

function isTabState(obj: any): obj is TabState {
  // We don't persist the hash, so we skip the check here
  return (
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    hasStringKey(obj, 'id') &&
    hasStringKey(obj, 'title') &&
    hasStringOrNullKey(obj, 'query') &&
    hasStringOrNullKey(obj, 'variables') &&
    hasStringOrNullKey(obj, 'headers') &&
    hasStringOrNullKey(obj, 'operationName') &&
    hasStringOrNullKey(obj, 'response')
  );
}

function hasNumberKey(obj: Record<string, any>, key: string) {
  return key in obj && typeof obj[key] === 'number';
}

function hasStringKey(obj: Record<string, any>, key: string) {
  return key in obj && typeof obj[key] === 'string';
}

function hasStringOrNullKey(obj: Record<string, any>, key: string) {
  return key in obj && (typeof obj[key] === 'string' || obj[key] === null);
}

export function useSynchronizeActiveTabValues({
  queryEditor,
  variableEditor,
  headerEditor,
  responseEditor,
}: {
  queryEditor: CodeMirrorEditorWithOperationFacts | null;
  variableEditor: CodeMirrorEditor | null;
  headerEditor: CodeMirrorEditor | null;
  responseEditor: CodeMirrorEditor | null;
}) {
  return useCallback<(state: TabsState) => TabsState>(
    state => {
      const query = queryEditor?.getValue() ?? null;
      const variables = variableEditor?.getValue() ?? null;
      const headers = headerEditor?.getValue() ?? null;
      const operationName = queryEditor?.operationName ?? null;
      const response = responseEditor?.getValue() ?? null;
      return setPropertiesInActiveTab(state, {
        query,
        variables,
        headers,
        response,
        operationName,
      });
    },
    [queryEditor, variableEditor, headerEditor, responseEditor],
  );
}

export function useStoreTabs({
  storage,
  shouldPersistHeaders,
}: {
  storage: StorageAPI | null;
  shouldPersistHeaders?: boolean;
}) {
  const store = useMemo(
    () =>
      debounce(500, (value: string) => {
        storage?.set(STORAGE_KEY, value);
      }),
    [storage],
  );
  return useCallback(
    (currentState: TabsState) => {
      store(
        JSON.stringify(currentState, (key, value) =>
          key === 'hash' ||
          key === 'response' ||
          (!shouldPersistHeaders && key === 'headers')
            ? null
            : value,
        ),
      );
    },
    [shouldPersistHeaders, store],
  );
}

export function useSetEditorValues({
  queryEditor,
  variableEditor,
  headerEditor,
  responseEditor,
}: {
  queryEditor: CodeMirrorEditorWithOperationFacts | null;
  variableEditor: CodeMirrorEditor | null;
  headerEditor: CodeMirrorEditor | null;
  responseEditor: CodeMirrorEditor | null;
}) {
  return useCallback(
    ({
      query,
      variables,
      headers,
      response,
    }: {
      query: string | null;
      variables: string | null;
      headers: string | null;
      response: string | null;
    }) => {
      queryEditor?.setValue(query ?? '');
      variableEditor?.setValue(variables ?? '');
      headerEditor?.setValue(headers ?? '');
      responseEditor?.setValue(response ?? '');
    },
    [headerEditor, queryEditor, responseEditor, variableEditor],
  );
}

export function createTab({
  query = null,
  variables = null,
  headers = null,
}: Partial<Pick<TabState, 'query' | 'variables' | 'headers'>> = {}): TabState {
  return {
    id: guid(),
    hash: hashFromTabContents({ query, variables, headers }),
    title: DEFAULT_TITLE,
    query,
    variables,
    headers,
    operationName: null,
    response: null,
  };
}

export function setPropertiesInActiveTab(
  state: TabsState,
  partialTab: Partial<Omit<TabState, 'id' | 'hash' | 'title'>>,
): TabsState {
  return {
    ...state,
    tabs: state.tabs.map((tab, index) => {
      if (index !== state.activeTabIndex) {
        return tab;
      }
      const newTab = { ...tab, ...partialTab };
      return {
        ...newTab,
        hash: hashFromTabContents(newTab),
        title:
          newTab.operationName ||
          (newTab.query
            ? fuzzyExtractOperationName(newTab.query)
            : undefined) ||
          DEFAULT_TITLE,
      };
    }),
  };
}

function guid(): string {
  const s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  // return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

function hashFromTabContents(args: {
  query: string | null;
  variables: string | null;
  headers: string | null;
}): string {
  return [args.query ?? '', args.variables ?? '', args.headers ?? ''].join('|');
}

export function fuzzyExtractOperationName(str: string): string | null {
  const regex = /^(?!.*#).*(query|subscription|mutation)\s+([a-zA-Z0-9_]+)/;
  const match = regex.exec(str);

  return match?.[2] ?? null;
}

const DEFAULT_TITLE = '<untitled>';

const STORAGE_KEY = 'tabState';
