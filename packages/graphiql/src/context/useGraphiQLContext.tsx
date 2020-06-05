import React from 'react';

import storage from '../storage/index';
const {
  createContext,
  useReducer,
  useContext,
  useEffect,
  useCallback,
  useState,
} = React;

const BaseStateContext = createContext<{ state: any }>(null);
const BaseDispatchContext: React.Context<null> = createContext(null);
type IState<T> = Record<string, T[keyof T]>;
interface IAction {
  type: string;
  payload: string | Record<string, any>;
  persist?: boolean; // persist won't work if you haven't provided the namespace at the context.
}
type CustomActions = IAction[] | IAction;
type MultiDispatcher<T> = <T extends Record<string, any>>(
  oldState: IState<T>,
) => CustomActions;

export const baseReducer = (namespace?: string) => <
  T extends Record<string, any>
>(
  state: IState<T>,
  action: IAction,
): object => {
  const { type, payload, persist } = action;
  const nextState = { ...state, [type]: payload };
  if (persist && namespace) {
    storage.getItem(namespace).then(async data => {
      if (!data) {
        data = {};
      }
      await storage.saveItem(namespace, { ...data, [type]: payload });
    });
  }
  return nextState;
};

export const useBaseReducer = <T extends Record<string, any>>(
  initialState: IState<T>,
  namespace?: string,
) => {
  return useReducer(baseReducer(namespace), initialState);
};

// we need a state wrapper, that decides whether to retrieve the data from the original context's value, or the persisted storage.
export const BaseProvider = <T extends Record<string, any>>({
  children,
  initialState,
  namespace,
}: {
  children: JSX.Element;
  initialState: IState<T>;
  namespace?: string;
}) => {
  if (typeof initialState !== 'object' && !Array.isArray(initialState)) {
    throw new Error('initialState should be object');
  }
  const [state, dispatch] = useBaseReducer(initialState, namespace);

  const storageHasDataByNamespace = useCallback(async () => {
    if (!namespace) {
      return;
    }

    const data = await storage.getItem(namespace);
    await storage.push('namespaces', namespace);

    // if the local storage has the data with the key of namespace, we set the initial state of the context with
    // the value of the local storage instead of the passed initial state to assure persistency.
    if (data) {
      dispatch(data);
      return;
    }
  }, [namespace, initialState]);
  // if the current namespace at the storage api exists with a data, and we are trying to instantiate the context.
  // it means that we are refreshing the context, and we are setting up the initial state. therefore, we will replace the initial state
  // with the state that's provided by the storage api.
  useEffect(() => {
    storageHasDataByNamespace();
  }, [storageHasDataByNamespace]);
  // multiDispatcher is used to dispatch multiple actions or a single action providing the oldState optionally.
  const multiDispatcher = useCallback(
    <T extends Record<string, any>>(
      actions: MultiDispatcher<T> | CustomActions,
    ) => {
      let customDispatcher: CustomActions;
      if (typeof actions === 'function') {
        customDispatcher = actions(state);
      } else {
        customDispatcher = actions;
      }
      if (Array.isArray(customDispatcher)) {
        customDispatcher.forEach(action => dispatch(action));
        return;
      }
      dispatch(customDispatcher);
    },
    [state],
  );
  return (
    <BaseDispatchContext.Provider value={multiDispatcher}>
      <BaseStateContext.Provider value={state}>
        {children}
      </BaseStateContext.Provider>
    </BaseDispatchContext.Provider>
  );
};

export const useGraphiQLStorage = (namespace?: string | string[]) => {
  const [state, setState] = useState();
  useEffect(() => {
    if (!namespace) {
      setState(async () => await storage.getAll());
    }
    if (Array.isArray(namespace)) {
      setState(async () => await storage.getAllItems(namespace));
      return;
    }
    setState(async () => await storage.getItem(namespace));
  }, [setState]);
  return state;
};
export const useBaseState = () => {
  const state = useContext(BaseStateContext);
  if (state === undefined) {
    throw new Error('useBaseState must be used within a RegisterProvider');
  }
  return state;
};

export const useBaseDispatch = () => {
  const context = useContext(BaseDispatchContext);
  if (context === undefined) {
    throw new Error('useBaseDispatch must be used within a RegisterProvider');
  }
  return context;
};
