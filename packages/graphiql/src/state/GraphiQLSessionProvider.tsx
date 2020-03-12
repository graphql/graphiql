import * as React from 'react';
import {
  useReducers,
  generateActionTypeMap,
  DispatchWithEffects,
  ReducerAction,
} from './useReducers';
import { Fetcher } from './types';
import getQueryFacts from '../utility/getQueryFacts';

import { GraphQLParams, SessionState, EditorContexts } from './types';

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

type EditorPayload = { context: EditorContexts; editor: CodeMirror.Editor };

type ErrorPayload = { error: Error; sessionId: number };

type SuccessPayload = { sessionId: number; result: string };

type ChangeValuePayload = { sessionId: number; value: string };

export type ActionState = ReducerAction<
  AT,
  {
    error?: Error;
    payload?:
      | EditorPayload
      | ErrorPayload
      | SuccessPayload
      | ChangeValuePayload;
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
  operationError: (error: Error) => void;
  editorLoaded: (context: EditorContexts, editor: CodeMirror.Editor) => void;
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
  // @ts-ignore
  editors: {},
};

export const initialContextState: SessionState & SessionHandlers = {
  executeOperation: async () => {},
  changeOperation: () => null,
  changeVariables: () => null,
  operationError: () => null,
  dispatch: () => null,
  editorLoaded: () => null,
  ...initialState,
};

export const SessionContext = React.createContext<
  SessionState & SessionHandlers
>(initialContextState);

export const useSessionContext = (): SessionState & SessionHandlers =>
  React.useContext(SessionContext);

export function getSessionReducer(schema: GraphQLSchema) {
  return (state: SessionState, { type: actionType, payload }: ActionState) => {
    switch (actionType) {
      case actionTypes.editor_loaded: {
        const { context, editor } = payload as EditorPayload;
        state.editors[context as EditorContexts] = editor as CodeMirror.Editor;
        return state;
      }
      case actionTypes.operation_changed: {
        const { value } = payload as ChangeValuePayload;
        state.operation.text = value as string;
        return {
          ...state,
          ...getQueryFacts(schema as GraphQLSchema, value),
        };
      }
      case actionTypes.variables_changed: {
        const { value } = payload as ChangeValuePayload;
        state.variables.text = value as string;
        return state;
      }
      case actionTypes.operation_succeeded: {
        const { result } = payload as SuccessPayload;
        state.results.text = result as string;
        state.results.formattedText = JSON.stringify(result, null, 2);
        state.operationErrors = null;
        return state;
      }
      case actionTypes.operation_errored: {
        const { error } = payload as ErrorPayload;
        state.operationErrors = [error.toString()];
        return state;
      }
      default: {
        return state;
      }
    }
  };
}

export type SessionProviderProps = {
  sessionId: number;
  fetcher?: Fetcher;
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

  const [state, dispatch] = useReducers<SessionState, AT, ActionState>({
    reducers: [getSessionReducer(schemaState.schema as GraphQLSchema)],
    init: () => initialState,
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
  const changeOperation = (operationText: string) => {
    dispatch({
      type: actionTypes.operation_changed,
      payload: { value: operationText, sessionId },
    });
  };

  const changeVariables = (variablesText: string) =>
    dispatch({
      type: actionTypes.variables_changed,
      payload: { value: variablesText, sessionId },
    });
  const executeOperation = async (
    sessionState: SessionState,
    operationName?: string,
  ) => {
    try {
      dispatch({
        type: actionTypes.operation_requested,
      });

      const fetchValues: GraphQLParams = {
        query: sessionState?.operation?.text ?? '',
      };
      if (sessionState.variables?.text) {
        fetchValues.variables = sessionState.variables.text as string;
      }
      if (operationName) {
        fetchValues.operationName = operationName as string;
      }
      const result = await fetcher(fetchValues, schemaState.config);
      dispatch({
        type: actionTypes.operation_succeeded,
        payload: { sessionId, result } as SuccessPayload,
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
