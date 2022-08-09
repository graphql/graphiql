/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import { Fetcher, FetcherResult } from '../../types';

import { GraphQLParams, SessionState } from '../types';

import { SchemaContext } from './GraphiQLSchemaProvider';
import { EditorContext } from './GraphiQLEditorsProvider';
import {
  SessionAction,
  SessionActionTypes,
  operationRequestAction,
  operationSucceededAction,
  variableChangedAction,
  operationChangedAction,
  operationErroredAction,
  tabChangedAction,
} from '../actions/sessionActions';

import { observableToPromise } from '../../utility/observableToPromise';
// import { KeyMod, KeyCode } from 'monaco-editor';

export type SessionReducer = React.Reducer<SessionState, SessionAction>;
export interface SessionHandlers {
  changeOperation: (operation: string) => void;
  changeVariables: (variables: string) => void;
  changeTab: (pane: string, tabId: number) => void;
  executeOperation: (operationName?: string) => Promise<void>;
  operationError: (error: Error) => void;
  dispatch: React.Dispatch<SessionAction>;
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
  changeTab: () => null,
  operationError: () => null,
  dispatch: () => null,
  ...initialState,
};

export const SessionContext = React.createContext<
  SessionState & SessionHandlers
>(initialContextState);

export const useSessionContext = () => React.useContext(SessionContext);

const sessionReducer: SessionReducer = (state, action) => {
  switch (action.type) {
    case SessionActionTypes.OperationRequested:
      return {
        ...state,
        operationLoading: true,
      };
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
          text: JSON.stringify(result, null, 2),
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
    case SessionActionTypes.TabChanged: {
      const { pane, tabId } = action.payload;
      return {
        ...state,
        currentTabs: {
          ...state.currentTabs,
          [pane]: tabId,
        },
      };
    }
    default: {
      return state;
    }
  }
};

export type SessionProviderProps = {
  sessionId: number;
  fetcher: Fetcher;
  session?: SessionState;
  children: React.ReactNode;
};

export function SessionProvider({
  sessionId,
  fetcher,
  session,
  children,
}: SessionProviderProps) {
  const schemaState = React.useContext(SchemaContext);
  const editorsState = React.useContext(EditorContext);

  const [state, dispatch] = React.useReducer<SessionReducer>(
    sessionReducer,
    initialState,
  );

  const operationError = React.useCallback(
    (error: Error) => dispatch(operationErroredAction(error, sessionId)),
    [sessionId],
  );

  const changeOperation = React.useCallback(
    (operationText: string) =>
      dispatch(operationChangedAction(operationText, sessionId)),
    [sessionId],
  );

  const changeVariables = React.useCallback(
    (variablesText: string) =>
      dispatch(variableChangedAction(variablesText, sessionId)),
    [sessionId],
  );

  const changeTab = React.useCallback(
    (pane: string, tabId: number) => dispatch(tabChangedAction(pane, tabId)),
    [],
  );

  const executeOperation = React.useCallback(
    async (operationName?: string) => {
      try {
        dispatch(operationRequestAction());
        const { operation: op, variables: vars } = editorsState.editors;
        const operation = op.editor.getValue();
        const variables = vars.editor.getValue();

        const fetchValues: GraphQLParams = {
          query: operation ?? '',
        };
        if (variables && variables !== '{}') {
          fetchValues.variables = variables;
        }
        if (operationName) {
          fetchValues.operationName = operationName as string;
        }
        const result = await observableToPromise<FetcherResult>(
          fetcher(fetchValues),
        );
        dispatch(operationSucceededAction(result, sessionId));
      } catch (err) {
        console.error(err.name, err.stack);
        operationError(err);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      fetcher,
      operationError,
      schemaState.config,
      sessionId,
      editorsState.editors,
    ],
  );

  React.useEffect(() => {
    if (editorsState.editors.operation) {
      editorsState.editors.operation.editor.addAction({
        id: 'run-command',
        label: 'Run Operation',
        contextMenuOrder: 0,
        contextMenuGroupId: 'operation',
        // eslint-disable-next-line no-bitwise
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: async () => {
          return executeOperation();
        },
      });
    }
  }, [editorsState.editors.operation, executeOperation]);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        ...session,
        executeOperation,
        changeOperation,
        changeVariables,
        changeTab,
        operationError,
        dispatch,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
