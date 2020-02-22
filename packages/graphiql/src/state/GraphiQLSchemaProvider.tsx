import * as React from 'react';
import { GraphQLSchema } from 'graphql';
import {
  generateActionTypeMap,
  DispatchWithEffects,
  useReducers,
  Reducer,
} from './useReducers';
import { defaultSchemaLoader } from './common';
import { SchemaConfig } from './types';

/**
 * Initial State
 */

export type SchemaState = {
  schema: GraphQLSchema | null;
  isLoading: boolean;
  hasError: boolean;
  error?: string;
  config: SchemaConfig;
};

export const initialReducerState: SchemaState = {
  isLoading: false,
  hasError: false,
  config: { uri: 'https://swapi-graphql.netlify.com/.netlify/functions/index' },
  schema: null,
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

export type SchemaContextValue = { state: SchemaState } & ProjectHandlers;

export const SchemaContext = React.createContext<SchemaContextValue>({
  state: getInitialState(),
  loadCurrentSchema: async () => undefined,
  loadSchema: async () => undefined,
  dispatch: async () => undefined,
  schemaLoader: defaultSchemaLoader,
});

export const useSchemaContext = () => React.useContext(SchemaContext);

/**
 * Action Types & Reducers
 */

export const actionTypes = generateActionTypeMap([
  'schema_changed',
  'schema_requested',
  'schema_succeeded',
  'schema_errored',
  'schema_reset',
]);

export type AT = keyof typeof actionTypes;

export type SchemaAction = {
  type: AT;
  payload: { isLoading: boolean } & GraphQLSchema & SchemaConfig;
};

export type SchemaReducer = Reducer<SchemaState, AT, SchemaAction>;

export const schemaReducer: SchemaReducer = (
  state,
  { type: actionType, payload },
  init,
) => {
  switch (actionType) {
    case actionTypes.schema_changed: {
      state.isLoading = true;
      state.config = payload;
      return state;
    }
    case actionTypes.schema_requested: {
      state.isLoading = true;
      return state;
    }
    case actionTypes.schema_succeeded: {
      state.isLoading = false;
      state.hasError = false;
      state.schema = payload;
      return state;
    }
    case actionTypes.schema_errored: {
      state.isLoading = false;
      state.hasError = true;
      state.error = payload.toString();
      return state;
    }
    case actionTypes.schema_reset: {
      return init();
    }
    default: {
      return state;
    }
  }
};

/**
 * Provider
 */

export type SchemaProviderProps = {
  config: SchemaConfig;
  schemaLoader?: typeof defaultSchemaLoader;
  children?: any;
};

export type ProjectHandlers = {
  loadSchema: (state: SchemaState, config: SchemaConfig) => Promise<void>;
  loadCurrentSchema: (state: SchemaState) => Promise<void>;
  schemaLoader: typeof defaultSchemaLoader;
  dispatch: DispatchWithEffects<AT, SchemaAction>;
};

export function SchemaProvider({
  schemaLoader = defaultSchemaLoader,
  config: userSchemaConfig = initialReducerState.config,
  ...props
}: SchemaProviderProps) {
  const [didMount, setDidMount] = React.useState(false);
  const [state, dispatch] = useReducers<
    SchemaState,
    SchemaAction,
    SchemaReducer
  >({
    reducers: [schemaReducer],
    init: args => ({
      ...getInitialState({ config: userSchemaConfig }),
      ...args,
    }),
  });

  const loadCurrentSchema = async (currentState: SchemaState) => {
    const { config } = currentState;
    dispatch({ type: actionTypes.schema_requested });
    try {
      const schema = await schemaLoader(config);
      dispatch({ type: actionTypes.schema_succeeded, payload: schema });
    } catch (error) {
      dispatch({ type: actionTypes.schema_errored, payload: error });
    }
  };

  const loadSchema = async (
    currentState: SchemaState,
    config: SchemaConfig,
  ) => {
    dispatch({ type: actionTypes.schema_changed, payload: { config } });
    await loadCurrentSchema(currentState);
  };

  React.useEffect(() => {
    if (!didMount) {
      (async () => loadCurrentSchema(state))();
      setDidMount(true);
    }
  });

  return (
    <SchemaContext.Provider
      value={{
        state,
        schemaLoader,
        loadCurrentSchema,
        loadSchema,
        dispatch,
      }}>
      {props.children}
    </SchemaContext.Provider>
  );
}
