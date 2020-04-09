import React, { useCallback, useEffect } from 'react';
import { GraphQLSchema } from 'graphql';
import { DispatchWithEffects, useReducers, Reducer } from './useReducers';
import { getDefaultFetcher, fetchSchema } from './common';
import { SchemaConfig, Fetcher } from './types';
import {
  SchemaAction,
  SchemaActionTypes,
  schemaRequestedAction,
  schemaSucceededAction,
  schemaErroredAction,
  schemaChangedAction,
} from './schemaActions';

/**
 * Initial State
 */

export type SchemaState = {
  schema: GraphQLSchema | null;
  isLoading: boolean;
  errors: Error[] | null;
  config: SchemaConfig;
  fetcher?: Fetcher;
};

export const initialReducerState: SchemaState = {
  isLoading: false,
  schema: null,
  errors: null,
  config: {},
};

export const getInitialState = (
  initialState?: Partial<SchemaState>,
): SchemaState => ({
  ...initialReducerState,
  ...initialState,
});

/**
 * Context
 */

export type SchemaContextValue = SchemaState & ProjectHandlers;

export const SchemaContext = React.createContext<SchemaContextValue>({
  ...getInitialState(),
  loadCurrentSchema: async () => undefined,
  loadSchema: async () => undefined,
  dispatch: async () => undefined,
  // schemaLoader: defaultSchemaLoader,
});

export const useSchemaContext = () => React.useContext(SchemaContext);

/**
 * Action Types & Reducers
 */

export type SchemaReducer = Reducer<
  SchemaState,
  SchemaActionTypes,
  SchemaAction
>;

export const schemaReducer: SchemaReducer = (
  state,
  action,
  init,
): SchemaState => {
  switch (action.type) {
    case SchemaActionTypes.SchemaRequested:
      return {
        ...state,
        isLoading: true,
      };
    case SchemaActionTypes.SchemaSucceeded:
      return {
        ...state,
        isLoading: false,
        schema: action.payload,
      };
    case SchemaActionTypes.SchemaErrored:
      return {
        ...state,
        isLoading: false,
        errors: state.errors
          ? [...state.errors, action.payload]
          : [action.payload],
      };
    case SchemaActionTypes.SchemaReset:
      return init();
    default: {
      return state;
    }
  }
};

/**
 * Provider
 */

export type SchemaProviderProps = {
  config?: SchemaConfig;
  fetcher: Fetcher;
  children?: any;
};

export type ProjectHandlers = {
  loadSchema: (state: SchemaState, config: SchemaConfig) => Promise<void>;
  loadCurrentSchema: (state: SchemaState) => Promise<void>;
  // schemaLoader: typeof defaultSchemaLoader;
  dispatch: DispatchWithEffects<SchemaActionTypes, SchemaAction>;
};

export function SchemaProvider({
  fetcher,
  config: userSchemaConfig = initialReducerState.config,
  ...props
}: SchemaProviderProps) {
  const [state, dispatch] = useReducers<
    SchemaState,
    SchemaAction,
    SchemaReducer
  >({
    // @ts-ignore
    reducers: [schemaReducer],
    init: args => ({
      ...getInitialState({ config: userSchemaConfig }),
      ...args,
    }),
  });

  const loadCurrentSchema = useCallback(async () => {
    dispatch(schemaRequestedAction());
    try {
      const schema = await fetchSchema(fetcher);

      if (schema) {
        dispatch(schemaSucceededAction(schema));
      }
    } catch (error) {
      dispatch(schemaErroredAction(error));
    }
  }, [dispatch, fetcher]);

  const loadSchema = useCallback(
    (config: SchemaConfig) => {
      dispatch(schemaChangedAction(config));
    },
    [dispatch],
  );

  useEffect(() => {
    loadCurrentSchema();
  }, [loadCurrentSchema]);

  return (
    <SchemaContext.Provider
      value={{
        ...state,
        loadCurrentSchema,
        loadSchema,
        dispatch,
      }}>
      {props.children}
    </SchemaContext.Provider>
  );
}
