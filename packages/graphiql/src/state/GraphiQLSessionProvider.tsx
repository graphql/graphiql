import * as React from 'react';
import { useReducers, DispatchWithEffects } from './useReducers';
import { Fetcher } from './types';

import { GraphQLParams, SessionState, EditorContexts } from './types';

import { defaultFetcher } from './common';
import { SchemaContext } from './GraphiQLSchemaProvider';
import {
  SessionAction,
  SessionActionTypes,
  operationRequestAction,
  operationSucceededAction,
  variableChangedAction,
  operationChangedAction,
  editorLoadedAction,
  operationErroredAction,
} from './sessionActions';
import { observableToPromise } from '../utility/observableToPromise';

type Dispatcher = DispatchWithEffects<SessionActionTypes, SessionAction>;

export interface SessionHandlers {
  changeOperation: (operation: string) => void;
  changeVariables: (variables: string) => void;
  executeOperation: (operationName?: string) => Promise<void>;
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

export const useSessionContext = () => React.useContext(SessionContext);

function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case SessionActionTypes.OperationRequested:
      return {
        ...state,
        operationLoading: true,
      };
    case SessionActionTypes.EditorLoaded: {
      const { context, editor } = action.payload;
      return {
        ...state,
        editors: {
          ...state.editors,
          [context as EditorContexts]: editor,
        },
      };
    }
    case SessionActionTypes.OperationChanged: {
      const { value } = action.payload;
      return {
        ...state,
        operation: {
          ...state.operation,
          text: value,
        },
      };
    }
    case SessionActionTypes.VariablesChanged: {
      const { value } = action.payload;
      return {
        ...state,
        variables: {
          ...state.variables,
          text: value,
        },
      };
    }
    case SessionActionTypes.OperationSucceeded: {
      const { result } = action.payload;
      return {
        ...state,
        results: {
          ...state.results,
          text: result,
        },
        operationErrors: null,
      };
    }
    case SessionActionTypes.OperationErrored: {
      const { error } = action.payload;
      return {
        ...state,
        operationErrors: state.operationErrors
          ? [...state.operationErrors, error]
          : [error],
      };
    }
    default: {
      return state;
    }
  }
}

export type SessionProviderProps = {
  sessionId: number;
  fetcher?: Fetcher;
  session?: SessionState;
  children: React.ReactNode;
};

export function SessionProvider({
  sessionId,
  fetcher = defaultFetcher,
  session,
  children,
}: SessionProviderProps) {
  const schemaState = React.useContext(SchemaContext);

  const [state, dispatch] = useReducers<
    SessionState,
    SessionActionTypes,
    SessionAction
  >({
    reducers: [sessionReducer],
    init: () => initialState,
  });

  const operationError = React.useCallback(
    (error: Error) => dispatch(operationErroredAction(error, sessionId)),
    [dispatch, sessionId],
  );

  const editorLoaded = React.useCallback(
    (context: EditorContexts, editor: CodeMirror.Editor) =>
      dispatch(editorLoadedAction(context, editor)),
    [dispatch],
  );

  const changeOperation = React.useCallback(
    (operationText: string) =>
      dispatch(operationChangedAction(operationText, sessionId)),
    [dispatch, sessionId],
  );

  const changeVariables = React.useCallback(
    (variablesText: string) =>
      dispatch(variableChangedAction(variablesText, sessionId)),
    [dispatch, sessionId],
  );

  const executeOperation = React.useCallback(
    async (operationName?: string) => {
      try {
        dispatch(operationRequestAction());

        const fetchValues: GraphQLParams = {
          query: state.operation?.text ?? '',
        };
        if (state.variables?.text) {
          fetchValues.variables = state.variables.text as string;
        }
        if (operationName) {
          fetchValues.operationName = operationName as string;
        }
        const result = await observableToPromise(
          fetcher(fetchValues, schemaState.config),
        );
        dispatch(operationSucceededAction(result, sessionId));
      } catch (err) {
        console.error(err.name, err.stack);
        operationError(err);
      }
    },
    [
      dispatch,
      fetcher,
      operationError,
      schemaState.config,
      sessionId,
      state.operation,
      state.variables,
    ],
  );

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
      {children}
    </SessionContext.Provider>
  );
}
