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
    // if persist and the namespace are available.
    // we will get the item by its namespace then we will merge the data with the only pieces we wish to update via the type and payload.
    // with that done, we won't update all of the state, with the current status of the context's state, but we will sync whatever we want
    // to persist at our state when enabling the persist flag.
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
    // push the namespace to the namespaces, to know which keys at the localstorage belongs to graphiql.
    // if the namespace exists, the push method won't push it.
    await storage.push('namespaces', namespace);

    // if the local storage has the data with the key of namespace, we set the initial state of the context with
    // the value of the local storage instead of the passed initial state to assure persistency.
    if (data) {
      dispatch(data);
    }
  }, [namespace]);
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
  const memoizedSetState = useCallback(value => setState(value), [setState]);
  useEffect(() => {
    // if there is no namespace, we will get all of the graphql modules from local storage
    // using the getAll method which will fetch all of the namespaces and then getAllItems with these namespaces that we saved earlier.
    if (!namespace) {
      memoizedSetState(async () => storage.getAll());
    }
    // if the namespace is array, we will fetch all of the items with the related of each namespace.
    if (Array.isArray(namespace)) {
      memoizedSetState(async () => storage.getAllItems(namespace));
      return;
    }
    // otherwise, we will fetch a single item by its namespace.
    memoizedSetState(async () => storage.getItem(namespace));
  }, [memoizedSetState]);
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
