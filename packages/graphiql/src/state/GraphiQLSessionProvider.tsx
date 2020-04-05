import * as React from 'react';
import { useReducers, DispatchWithEffects } from './useReducers';
import { Fetcher } from './types';
import getQueryFacts from '../utility/getQueryFacts';

import { GraphQLParams, SessionState, EditorContexts } from './types';

import { defaultFetcher } from './common';
import { SchemaContext } from './GraphiQLSchemaProvider';
import { GraphQLSchema } from 'graphql';
import { Action, ActionTypes, SuccessPayload } from './actions';

type Dispatcher = DispatchWithEffects<ActionTypes, Action>;

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

export const useSessionContext = (): SessionState & SessionHandlers =>
  React.useContext(SessionContext);

export function getSessionReducer(schema: GraphQLSchema) {
  return (state: SessionState, action: Action): SessionState => {
    switch (action.type) {
      case ActionTypes.OperationRequested:
        return {
          ...state,
          operationLoading: true,
        };
      case ActionTypes.EditorLoaded: {
        const { context, editor } = action.payload;
        return {
          ...state,
          editors: {
            ...state.editors,
            [context as EditorContexts]: editor,
          },
        };
      }
      case ActionTypes.OperationChanged: {
        const { value } = action.payload;
        return {
          ...state,
          operation: {
            ...state.operation,
            text: value,
          },
          ...getQueryFacts(schema, value),
        };
      }
      case ActionTypes.VariablesChanged: {
        const { value } = action.payload;
        return {
          ...state,
          variables: {
            ...state.variables,
            text: value,
          },
        };
      }
      case ActionTypes.OperationSucceeded: {
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
      case ActionTypes.OperationErrored: {
        const { error } = action.payload;
        return {
          ...state,
          operationErrors: [error.toString()],
        };
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

  const [state, dispatch] = useReducers<SessionState, ActionTypes, Action>({
    reducers: [getSessionReducer(schemaState.schema as GraphQLSchema)],
    init: () => initialState,
  });

  const operationError = (error: Error) =>
    dispatch({
      type: ActionTypes.OperationErrored,
      payload: { error, sessionId },
    });
  const editorLoaded = (context: EditorContexts, editor: CodeMirror.Editor) => {
    dispatch({
      type: ActionTypes.EditorLoaded,
      payload: { editor, context },
    });
  };
  const changeOperation = (operationText: string) => {
    dispatch({
      type: ActionTypes.OperationChanged,
      payload: { value: operationText, sessionId },
    });
  };

  const changeVariables = (variablesText: string) =>
    dispatch({
      type: ActionTypes.VariablesChanged,
      payload: { value: variablesText, sessionId },
    });
  const executeOperation = async (operationName?: string) => {
    try {
      dispatch({
        type: ActionTypes.OperationRequested,
      });

      const fetchValues: GraphQLParams = {
        query: state.operation?.text ?? '',
      };
      if (state.variables?.text) {
        fetchValues.variables = state.variables.text as string;
      }
      if (operationName) {
        fetchValues.operationName = operationName as string;
      }
      const result = await fetcher(fetchValues, schemaState.config);
      dispatch({
        type: ActionTypes.OperationSucceeded,
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
