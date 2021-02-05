import * as React from 'react';
import { parseQueryStringURL, updateQueryStringURL } from '@graphiql/toolkit';
import { BrowserState } from '../types';

import {
  BrowserAction,
  BrowserActionTypes,
  queryStringParamsChangedAction,
} from '../actions/browserActions';

export type BrowserReducer = React.Reducer<BrowserState, BrowserAction>;
export interface BrowserHandlers {
  changeQueryStringParams: (parameter: string, value: string) => void;
  dispatch: React.Dispatch<BrowserAction>;
}

export const initialBrowserState: BrowserState = {
  queryStringParams: {
    operation:
      parseQueryStringURL(window.location.search).operation ||
      parseQueryStringURL(window.location.search).query,
    variables: parseQueryStringURL(window.location.search).variables,
    operationName: parseQueryStringURL(window.location.search).operationName,
  },
  queryStringParamsURL: '',
};

export const initialBrowserContextState: BrowserState & BrowserHandlers = {
  changeQueryStringParams: () => null,
  dispatch: () => null,
  ...initialBrowserState,
};

export const BrowserContext = React.createContext<
  BrowserState & BrowserHandlers
>(initialBrowserContextState);

export const useBrowserContext = () => React.useContext(BrowserContext);

const browserReducer: BrowserReducer = (state, action) => {
  switch (action.type) {
    case BrowserActionTypes.QueryStringParamsChanged: {
      const { parameter, value } = action.payload;
      return {
        ...state,
        queryStringParams: {
          ...state.queryStringParams,
          [parameter]: value,
        },
        queryStringParamsURL: updateQueryStringURL(
          state.queryStringParams,
          parameter,
          value,
        ),
      };
    }
    default: {
      return state;
    }
  }
};

export type BrowserProviderProps = {
  children: React.ReactNode;
};

export function BrowserProvider({ children }: BrowserProviderProps) {
  const [state, dispatch] = React.useReducer<BrowserReducer>(
    browserReducer,
    initialBrowserState,
  );

  const changeQueryStringParams = React.useCallback(
    (parameter: string, value: string) =>
      dispatch(queryStringParamsChangedAction(parameter, value)),
    [dispatch],
  );

  React.useEffect(() => {
    history.replaceState(null, document.title, state.queryStringParamsURL);
  }, [state.queryStringParamsURL]);

  return (
    <BrowserContext.Provider
      value={{
        ...state,
        changeQueryStringParams,
        dispatch,
      }}>
      {children}
    </BrowserContext.Provider>
  );
}
