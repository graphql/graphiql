import * as React from 'react';
import { GraphQLSchema } from 'graphql';
import {
  generateActionTypeMap,
  DispatchWithEffects,
  ActionDefault,
  useReducers,
} from './useReducers';
import { defaultSchemaLoader } from './common';
import { SchemaConfig } from './types';

export const actionTypes = generateActionTypeMap([
  'schema_changed',
  'schema_requested',
  'schema_succeeded',
  'schema_errored',
]);

type AT = keyof typeof actionTypes;

export type File = {
  uri: string;
  text?: string;
};

export type OperationParams = {
  query: string;
  variables: string;
  operationName: string;
};

export type SchemaState = {
  schema?: GraphQLSchema;
  isLoading: boolean;
  hasError: boolean;
  error?: string;
  config: SchemaConfig;
};

export type SchemaContextValue = { state: SchemaState } & ProjectHandlers;

export const initialReducerState: SchemaState = {
  isLoading: false,
  hasError: false,
  config: { uri: 'https://swapi-graphql.netlify.com/.netlify/functions/index' },
};

export const getInitialState = (
  initialState?: Partial<SchemaState>,
): SchemaState => ({
  ...initialReducerState,
  ...initialState,
});

export const SchemaContext = React.createContext<SchemaContextValue>({
  state: getInitialState(),
  loadCurrentSchema: async () => undefined,
  loadSchema: async () => undefined,
  dispatch: async () => undefined,
  schemaLoader: defaultSchemaLoader,
});

export const useSchemaContext = () => React.useContext(SchemaContext);

export type SchemaReducer<S = {}> = React.Reducer<
  S & SchemaState,
  React.ReducerAction<any>
>;

export const schemaReducer: SchemaReducer = (
  state: SchemaState,
  { type: actionType, payload },
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
    default: {
      return state;
    }
  }
};

export type SchemaActions = {
  type: AT;
  error?: Error;
  payload?: any;
};

export type SchemaProviderProps = {
  config: SchemaConfig;
  schemaLoader?: typeof defaultSchemaLoader;
  children?: any;
};

export type ProjectHandlers = {
  loadSchema: (state: SchemaState, config: SchemaConfig) => Promise<void>;
  loadCurrentSchema: (state: SchemaState) => Promise<void>;
  schemaLoader: typeof defaultSchemaLoader;
  dispatch: DispatchWithEffects<AT, SchemaActions>;
};

export function SchemaProvider({
  schemaLoader = defaultSchemaLoader,
  config: userSchemaConfig = initialReducerState.config,
  ...props
}: SchemaProviderProps) {
  const [didMount, setDidMount] = React.useState(false);
  const [state, dispatch] = useReducers<
    React.Reducer<SchemaState, ActionDefault>,
    ActionDefault
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
