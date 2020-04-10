import React, { useCallback, useEffect } from 'react';
import { GraphQLSchema } from 'graphql';
import { DispatchWithEffects, useReducers, Reducer } from './useReducers';
import { fetchSchema } from './common';
import { SchemaConfig, Fetcher } from './types';
import {
  SchemaAction,
  SchemaActionTypes,
  schemaRequestedAction,
  schemaSucceededAction,
  schemaErroredAction,
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
  loadSchema: async () => undefined,
  dispatch: async () => undefined,
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
  dispatch: DispatchWithEffects<SchemaActionTypes, SchemaAction>;
};

export function SchemaProvider({
  fetcher,
  config: userSchemaConfig = initialReducerState.config,
  ...props
}: SchemaProviderProps) {
  const [state, dispatch] = useReducers({
    reducers: [schemaReducer],
    init: args => ({
      ...getInitialState({ config: userSchemaConfig }),
      ...args,
    }),
  });

  const loadSchema = useCallback(async () => {
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

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  return (
    <SchemaContext.Provider
      value={{
        ...state,
        loadSchema,
        dispatch,
      }}>
      {props.children}
    </SchemaContext.Provider>
  );
}
