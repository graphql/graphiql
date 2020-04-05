import * as React from 'react';
import { generateActionTypeMap } from './useReducers';
import { Fetcher } from './types';
// import getQueryFacts from '../utility/getQueryFacts';

import { GraphQLParams, SessionState, EditorContexts } from './types';

import { defaultFetcher } from './common';
import { SchemaContext } from './GraphiQLSchemaProvider';
// import { GraphQLSchema } from 'graphql';
import useDispatchedCallback from '../hooks/useDispatchedCallback';

export const actionTypes = generateActionTypeMap([
  'editor_loaded',
  'operation_changed',
  'variables_changed',
  'operation_requested',
  'operation_succeeded',
  'operation_errored',
  'session_created',
]);
// type AT = keyof typeof actionTypes;

export interface SessionHandlers {
  changeOperation: (operation: string) => void;
  changeVariables: (variables: string) => void;
  executeOperation: (
    session: SessionState,
    operationName?: string,
  ) => Promise<void>;
  operationError: (error: Error) => void;
  editorLoaded: (context: EditorContexts, editor: CodeMirror.Editor) => void;
  // dispatch: Dispatcher;
}

const changeOperationAction = (payload: string) => ({
  type: actionTypes.operation_changed,
  payload,
});
const changeVariablesAction = (payload: string) => ({
  type: actionTypes.variables_changed,
  payload,
});
const executeOperationAction = () => ({
  type: actionTypes.operation_requested,
});
const operationErrorAction = (payload: Error) => ({
  type: actionTypes.operation_errored,
  payload,
});
const operationSucceededAction = (payload: { result: string }) => ({
  type: actionTypes.operation_succeeded,
  payload,
});
const editorLoadedAction = (
  context: EditorContexts,
  editor: CodeMirror.Editor,
) => ({
  type: actionTypes.editor_loaded,
  payload: { context, editor },
});

type Action =
  | ReturnType<typeof changeOperationAction>
  | ReturnType<typeof changeVariablesAction>
  | ReturnType<typeof executeOperationAction>
  | ReturnType<typeof operationSucceededAction>
  | ReturnType<typeof operationErrorAction>
  | ReturnType<typeof editorLoadedAction>;

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
  // operations: [],
  editors: {},
};

export const initialContextState: SessionState & SessionHandlers = {
  executeOperation: async () => {},
  changeOperation: () => null,
  changeVariables: () => null,
  operationError: () => null,
  // dispatch: () => null,
  editorLoaded: () => null,
  ...initialState,
};

export const SessionContext = React.createContext<
  SessionState & SessionHandlers
>(initialContextState);

export const useSessionContext = () => React.useContext(SessionContext);

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case actionTypes.editor_loaded: {
      const { context, editor } = action.payload;
      return {
        ...state,
        editors: {
          ...state.editors,
          [context]: editor,
        },
      };
    }
    case actionTypes.operation_changed: {
      return {
        ...state,
        operation: {
          ...state.operation,
          text: action.payload,
        },
        // TODO: do this in a useMemo where it's needed
        // ...getQueryFacts(schema, value),
      };
    }
    case actionTypes.variables_changed: {
      return {
        ...state,
        variables: {
          ...state.variables,
          text: action.payload,
        },
      };
    }
    case actionTypes.operation_succeeded: {
      return {
        ...state,
        operationErrors: null,
        results: {
          ...state.results,
          text: action.payload.result,
        },
      };
    }
    case actionTypes.operation_errored: {
      return {
        ...state,
        operationErrors: [String(action.payload)],
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

  const [state, dispatch] = React.useReducer(reducer, sessionId, () => ({
    ...initialState,
    sessionId,
  }));

  const operationError = useDispatchedCallback(dispatch, operationErrorAction);
  const editorLoaded = useDispatchedCallback(dispatch, editorLoadedAction);
  const changeOperation = useDispatchedCallback(
    dispatch,
    changeOperationAction,
  );
  const changeVariables = useDispatchedCallback(
    dispatch,
    changeVariablesAction,
  );

  const executeOperation = React.useCallback(
    async (sessionState: SessionState, operationName?: string) => {
      try {
        const fetchValues: GraphQLParams = {
          query: sessionState.operation.text ?? '',
        };
        if (sessionState.variables.text) {
          fetchValues.variables = sessionState.variables.text;
        }
        if (operationName) {
          fetchValues.operationName = operationName;
        }
        const result = await fetcher(fetchValues, schemaState.config);
        dispatch({
          type: actionTypes.operation_succeeded,
          payload: { result: result as string },
        });
      } catch (err) {
        console.error(err.name, err.stack);
        operationError(err);
      }
    },
    [fetcher, operationError, schemaState.config],
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
        // dispatch,
      }}>
      {children}
    </SessionContext.Provider>
  );
}
