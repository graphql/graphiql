import {
  createGraphiQLStore,
  GraphiQLState,
  UserOptions,
} from '@graphiql/toolkit';

import {
  ExplorerContextProvider,
  ExplorerContextProviderProps,
} from './explorer/context';
import { HistoryContextProvider, HistoryContextProviderProps } from './history';
import { PluginContextProvider, PluginContextProviderProps } from './plugin';

import { StorageContextProvider, StorageContextProviderProps } from './storage';
import { createContext, useContext, useEffect, useRef } from 'react';
import { useStore } from 'zustand';

export type GraphiQLProviderProps = UserOptions &
  ExplorerContextProviderProps &
  HistoryContextProviderProps &
  PluginContextProviderProps &
  StorageContextProviderProps &
  DeprecatedControlledProps;

export type DeprecatedControlledProps = {
  /**
   * @deprecated Use hooks for controlled state
   */
  operationName?: string;
  /**
   * @deprecated Use hooks for controlled state, or defaultQuery for default state
   */
  query?: string;
  /**
   * @deprecated Use hooks for controlled state
   */
  response?: string;
  /**
   * @deprecated Use hooks instead, or defaultVariables for default state
   */
  variables?: string;
  /**
   * @deprecated Use hooks for controlled state, or defaultHeaders for default state
   */
};

export const GraphiQLStoreContext = createContext<ReturnType<
  typeof createGraphiQLStore
> | null>(null);

export function GraphiQLProvider({
  children,
  dangerouslyAssumeSchemaIsValid,
  defaultQuery,
  defaultHeaders,
  defaultTabs,
  externalFragments,
  // @ts-expect-error TODO: fix fetcher type
  fetcher,
  // @ts-expect-error TODO: types
  fetchOptions,
  getDefaultFieldNames,
  headers,
  inputValueDeprecation,
  introspectionQueryName,
  maxHistoryLength,
  onEditOperationName,
  onSchemaChange,
  onTabChange,
  onTogglePluginVisibility,
  operationName,
  plugins,
  query,
  response,
  schema,
  schemaDescription,
  shouldPersistHeaders,
  storage,
  validationRules,
  variables,
  visiblePlugin,
}: GraphiQLProviderProps) {
  const store = useRef(
    createGraphiQLStore({
      defaultQuery,
      defaultHeaders,
      defaultTabs,
      externalFragments,
      fetcher,
      getDefaultFieldNames,
      headers,
      inputValueDeprecation,
      introspectionQueryName,
      onEditOperationName,
      onSchemaChange,
      onTabChange,
      schema,
      schemaDescription,
      shouldPersistHeaders,
      validationRules,
      dangerouslyAssumeSchemaIsValid,
      fetchOptions,
    }),
  ).current;
  const state = useStore(store);
  useEffect(() => {
    state.schema.introspect();
  }, [state.execution.fetcher]);
  return (
    <GraphiQLStoreContext.Provider value={store}>
      <StorageContextProvider storage={storage}>
        <HistoryContextProvider maxHistoryLength={maxHistoryLength}>
          <ExplorerContextProvider>
            <PluginContextProvider
              onTogglePluginVisibility={onTogglePluginVisibility}
              plugins={plugins}
              visiblePlugin={visiblePlugin}
            >
              {children}
            </PluginContextProvider>
          </ExplorerContextProvider>
        </HistoryContextProvider>
      </StorageContextProvider>
    </GraphiQLStoreContext.Provider>
  );
}
