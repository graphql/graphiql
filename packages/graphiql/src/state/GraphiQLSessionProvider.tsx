import * as React from 'react';
import {
  useReducers,
  generateActionTypeMap,
  DispatchWithEffects,
  ReducerAction,
} from './useReducers';

import getQueryFacts from '../utility/getQueryFacts';

import { GraphQLParams, SessionState, EditorContexts } from './types';
import { SchemaState } from './GraphiQLSchemaProvider';

import { defaultFetcher } from './common';
import { SchemaContext } from './GraphiQLSchemaProvider';
import { GraphQLSchema } from 'graphql';

export const actionTypes = generateActionTypeMap([
  'editor_loaded',
  'operation_changed',
  'variables_changed',
  'operation_requested',
  'operation_succeeded',
  'operation_errored',
  'session_created',
]);
type AT = keyof typeof actionTypes;

export type ActionState = ReducerAction<
  AT,
  {
    error?: Error;
    sessionId: number;
    payload: { context: EditorContexts; editor: CodeMirror.Editor } & string;
  }
>;

type Dispatcher = DispatchWithEffects<AT, ActionState>;

export interface SessionHandlers {
  changeOperation: (operation: string) => void;
  changeVariables: (variables: string) => void;
  executeOperation: (
    session: SessionState,
    operationName?: string,
  ) => Promise<void>;
  operationError: (payload: { error: Error; sessionId: number }) => void;
  dispatch: Dispatcher;
}

export const initialState: SessionState = {
  sessionId: 0,
  operation: { uri: 'graphql://graphiql/operations/0.graphql' },
  variables: { uri: 'graphql://graphiql/variables/0.graphql' },
  results: { uri: 'graphql://graphiql/results/0.graphql' },
  currentTabs: {
    operation: 0,
    variables: 0,
    results: 0,
  },
  operationLoading: true,
  operationErrors: null,
  operations: [],
  editors: { operation: null, variables: null, results: null },
};

export const initialContextState: SessionState & SessionHandlers = {
  executeOperation: async () => {},
  changeOperation: () => null,
  changeVariables: () => null,
  operationError: () => null,
  dispatch: () => null,
  ...initialState,
};

export const SessionContext = React.createContext<
  SessionState & SessionHandlers
>(initialContextState);

export const useSessionContext = (): SessionState & SessionHandlers =>
  React.useContext(SessionContext);

export function sessionReducer(
  state: SessionState & SchemaState,
  { type: actionType, payload }: ActionState,
) {
  switch (actionType) {
    case actionTypes.editor_loaded: {
      state.editors[payload.context as EditorContexts] = payload.editor;
      return state;
    }
    case actionTypes.operation_changed: {
      state.operation.text = payload;
      return {
        ...state,
        ...getQueryFacts(state.schema as GraphQLSchema, state.operation.text),
      };
    }
    case actionTypes.variables_changed: {
      state.variables.text = payload;
      return state;
    }
    case actionTypes.operation_succeeded: {
      state.results.text = payload;
      state.results.json = JSON.parse(payload);
      state.results.formattedText = JSON.stringify(state.results.json, null, 2);
      state.operationErrors = null;
      return state;
    }
    case actionTypes.operation_errored: {
      state.operationErrors = [payload];
      return state;
    }
    default: {
      return state;
    }
  }
}

export type SessionProviderProps = {
  sessionId: number;
  fetcher?: typeof defaultFetcher;
  session?: SessionState;
  children: any;
};

export function SessionProvider({
  sessionId,
  fetcher = defaultFetcher,
  session,
  ...props
}: SessionProviderProps) {
  const schemaState = React.useContext(SchemaContext);

  const [state, dispatch] = useReducers<
    SessionState & SchemaState,
    AT,
    ActionState
  >({
    reducers: [sessionReducer],
    init: () => ({ ...initialState, ...schemaState }),
  });

  const operationError = (error: Error) =>
    dispatch({
      type: actionTypes.operation_errored,
      payload: { error, sessionId },
    });
  const editorLoaded = (context: EditorContexts, editor: CodeMirror.Editor) => {
    dispatch({
      type: actionTypes.operation_errored,
      payload: { editor, context },
    });
  };
  const changeOperation = (op: string) => {
    dispatch({ type: actionTypes.operation_changed, payload: op, sessionId });
  };

  const changeVariables = (variables: string) =>
    dispatch({
      type: actionTypes.variables_changed,
      payload: variables,
      sessionId,
    });
  const executeOperation = async (
    session: SessionState,
    operationName?: string,
  ) => {
    try {
      dispatch({
        type: actionTypes.operation_requested,
      });

      const fetchValues: GraphQLParams = {
        query: session?.operation?.text ?? '',
      };
      if (session.variables && session.variables.text) {
        fetchValues.variables = session.variables.text;
      }
      const result = await fetcher(fetchValues, schemaState.config);
      dispatch({
        type: actionTypes.operation_succeeded,
        sessionId,
        payload: result,
      });
    } catch (err) {
      console.error(err.name, err.stack);
      operationError(err);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        ...state,
        ...session,
        executeOperation,
        changeOperation,
        changeVariables,
        operationError,
        editorLoaded,
        dispatch,
      }}>
      {props.children}
    </SessionContext.Provider>
  );
}
