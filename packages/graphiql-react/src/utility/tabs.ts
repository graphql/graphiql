'use no memo'; // can't figure why it isn't optimized

import { storageStore } from '../stores';
import { debounce } from './debounce';
import { AllSlices } from '../types';

export type TabDefinition = {
  /**
   * The contents of the query editor of this tab.
   */
  query: string | null;
  /**
   * The contents of the variable editor of this tab.
   */
  variables?: string | null;
  /**
   * The contents of the headers editor of this tab.
   */
  headers?: string | null;
};

/**
 * This object describes the state of a single tab.
 */
export type TabState = TabDefinition & {
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
  defaultHeaders,
  headers,
  query,
  variables,
  defaultTabs = [
    {
      query: query ?? defaultQuery,
      variables,
      headers: headers ?? defaultHeaders,
    },
  ],
  shouldPersistHeaders,
}: {
  defaultQuery: string;
  defaultHeaders?: string;
  headers: string | null;
  defaultTabs?: TabDefinition[];
  query: string | null;
  variables: string | null;
  shouldPersistHeaders?: boolean;
}) {
  const { storage } = storageStore.getState();
  const storedState = storage.get(STORAGE_KEY);
  try {
    if (!storedState) {
      throw new Error('Storage for tabs is empty');
    }
    const parsed = JSON.parse(storedState);
    // if headers are not persisted, do not derive the hash using default headers state
    // or else you will get new tabs on every refresh
    const headersForHash = shouldPersistHeaders ? headers : undefined;
    if (isTabsState(parsed)) {
      const expectedHash = hashFromTabContents({
        query,
        variables,
        headers: headersForHash,
      });
      let matchingTabIndex = -1;

      for (let index = 0; index < parsed.tabs.length; index++) {
        const tab = parsed.tabs[index]!;
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
    }
    throw new Error('Storage for tabs is invalid');
  } catch {
    return {
      activeTabIndex: 0,
      tabs: defaultTabs.map(createTab),
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

export function serializeTabState(
  tabState: TabsState,
  shouldPersistHeaders = false,
) {
  return JSON.stringify(tabState, (key, value) =>
    key === 'hash' ||
    key === 'response' ||
    (!shouldPersistHeaders && key === 'headers')
      ? null
      : value,
  );
}

export function storeTabs({ tabs, activeTabIndex }: TabsState) {
  const { storage } = storageStore.getState();
  const { shouldPersistHeaders } = editorStore.getState();
  const store = debounce(500, (value: string) => {
    storage.set(STORAGE_KEY, value);
  });
  store(serializeTabState({ tabs, activeTabIndex }, shouldPersistHeaders));
}

export function createTab({
  query = null,
  variables = null,
  headers = null,
}: Partial<TabDefinition> = {}): TabState {
  const operationName = query ? fuzzyExtractOperationName(query) : null;
  return {
    id: guid(),
    hash: hashFromTabContents({ query, variables, headers }),
    title: operationName || DEFAULT_TITLE,
    query,
    variables,
    headers,
    operationName,
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
      .slice(1);
  };
  // return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

function hashFromTabContents(args: {
  query: string | null;
  variables?: string | null;
  headers?: string | null;
}): string {
  return [args.query ?? '', args.variables ?? '', args.headers ?? ''].join('|');
}

export function fuzzyExtractOperationName(str: string): string | null {
  const regex = /^(?!#).*(query|subscription|mutation)\s+([a-zA-Z0-9_]+)/m;

  const match = regex.exec(str);

  return match?.[2] ?? null;
}

export function clearHeadersFromTabs() {
  const { storage } = storageStore.getState();
  const persistedTabs = storage.get(STORAGE_KEY);
  if (persistedTabs) {
    const parsedTabs = JSON.parse(persistedTabs);
    storage.set(
      STORAGE_KEY,
      JSON.stringify(parsedTabs, (key, value) =>
        key === 'headers' ? null : value,
      ),
    );
  }
}

const DEFAULT_TITLE = '<untitled>';

export const STORAGE_KEY = 'tabState';
