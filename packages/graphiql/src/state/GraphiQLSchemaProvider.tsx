import React, { useCallback, useEffect } from 'react';
import { GraphQLSchema } from 'graphql';
import { defaultSchemaLoader } from './common';
import { SchemaConfig } from './types';
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
};

export type SchemaReducer = React.Reducer<SchemaState, SchemaAction>;

const isDev = window.location.hostname === 'localhost';

const uri = isDev
  ? 'http://localhost:8080/graphql'
  : 'https://swapi-graphql.netlify.com/.netlify/functions/index';

export const initialReducerState: SchemaState = {
  isLoading: false,
  config: {
    uri,
  },
  schema: null,
  errors: null,
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
  // loadSchema: async () => undefined,
  dispatch: async () => undefined,
  schemaLoader: defaultSchemaLoader,
});

export const useSchemaContext = () => React.useContext(SchemaContext);

/**
 * Action Types & Reducers
 */

export const schemaReducer: SchemaReducer = (state, action): SchemaState => {
  switch (action.type) {
    case SchemaActionTypes.SchemaChanged:
      return {
        ...state,
        isLoading: true,
        config: action.payload,
      };
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
  schemaLoader?: typeof defaultSchemaLoader;
  children?: any;
};

export type ProjectHandlers = {
  // loadSchema: (state: SchemaState, config: SchemaConfig) => Promise<void>;
  loadCurrentSchema: (state: SchemaState) => Promise<void>;
  schemaLoader: typeof defaultSchemaLoader;
  dispatch: React.Dispatch<SchemaAction>;
};

export function SchemaProvider({
  schemaLoader = defaultSchemaLoader,
  config: userSchemaConfig = initialReducerState.config,
  ...props
}: SchemaProviderProps) {
  const [state, dispatch] = React.useReducer<SchemaReducer>(
    schemaReducer,
    getInitialState({ config: userSchemaConfig }),
  );

  const loadCurrentSchema = useCallback(async () => {
    dispatch(schemaRequestedAction());
    try {
      const schema = await schemaLoader(state.config);
      if (schema) {
        dispatch(schemaSucceededAction(schema));
      }
    } catch (error) {
      dispatch(schemaErroredAction(error));
    }
  }, [dispatch, schemaLoader, state.config]);

  useEffect(() => {
    loadCurrentSchema();
  }, [loadCurrentSchema]);

  return (
    <SchemaContext.Provider
      value={{
        ...state,
        schemaLoader,
        loadCurrentSchema,
        dispatch,
      }}>
      {props.children}
    </SchemaContext.Provider>
  );
}
