/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback } from 'react';
import { GraphQLSchema } from 'graphql';
import { SchemaConfig, Fetcher } from '../../types';

import { defaultSchemaBuilder } from 'graphql-language-service';

import {
  SchemaAction,
  SchemaActionTypes,
  schemaRequestedAction,
  schemaSucceededAction,
  schemaErroredAction,
} from '../actions/schemaActions';

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

export const initialReducerState: SchemaState = {
  isLoading: false,
  config: { uri: '' },
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
  dispatch: async () => undefined,
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
  children?: any;
  fetcher: Fetcher;
};

export type ProjectHandlers = {
  loadCurrentSchema: (state: SchemaState) => Promise<void>;
  dispatch: React.Dispatch<SchemaAction>;
};

export function SchemaProvider({
  config: userSchemaConfig = initialReducerState.config,
  fetcher,
  ...props
}: SchemaProviderProps) {
  const [state, dispatch] = React.useReducer<SchemaReducer>(
    schemaReducer,
    getInitialState({ config: userSchemaConfig }),
  );

  const loadCurrentSchema = useCallback(async () => {
    dispatch(schemaRequestedAction());
    try {
      const { api: GraphQLAPI } = await import(
        'monaco-graphql/esm/monaco.contribution'
      );

      // @ts-ignore
      const schema: GraphQLSchema = await GraphQLAPI.getSchema();
      console.log('schema fetched');
      // @ts-ignore
      dispatch(schemaSucceededAction(defaultSchemaBuilder(schema)));
    } catch (error) {
      console.error(error);
      dispatch(schemaErroredAction(error));
    }
  }, []);

  React.useEffect(() => {
    if (state.config) {
      const {
        api: GraphQLAPI,
      } = require('monaco-graphql/esm/monaco.contribution');
      // @ts-ignore
      GraphQLAPI.setSchemaConfig(state.config);
    }
    setTimeout(() => {
      loadCurrentSchema()
        .then(() => {
          console.log('completed');
        })
        .catch(err => console.error(err));
    }, 200);
  }, [state.config, loadCurrentSchema]);

  return (
    <SchemaContext.Provider
      value={{
        ...state,
        loadCurrentSchema,
        dispatch,
      }}
    >
      {props.children}
    </SchemaContext.Provider>
  );
}
