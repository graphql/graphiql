import { useReducer, Reducer as ReactReducer } from 'react';

export type ActionDefault = { payload?: any; [key: string]: any };

export type Reducer<S, AT, A> = (
  state: S,
  action: ReducerAction<AT, A>,
  initFunction: () => S,
) => S;

export type ReducerAction<ActionTypes, Action> = {
  type: ActionTypes;
} & Action;

export type Effect<S, AT, A> = ({
  state,
  ...args
}: {
  state: S;
  action: ReducerAction<AT, A>;
}) => void | Promise<void>;

export type Effects<S, AT, A> = {
  [actionType: string]: Effect<S, AT, A>[];
};

export type UseReducersArgs<S, AT, A> = {
  reducers: Reducer<S, AT, A>[];
  init: (args?: Partial<S>) => S;
  effects?: Effects<S, AT, A>;
};

export type DispatchWithEffects<AT, A> = (action: ReducerAction<AT, A>) => void;

export function useReducers<State, ActionTypes, Action>({
  reducers = [],
  init = (args?) => Object.create(args || {}),
}: UseReducersArgs<State, ActionTypes, Action>): [
  State,
  DispatchWithEffects<ActionTypes, Action>,
] {
  const combineReducers: Reducer<State, ActionTypes, Action> = (
    nextState,
    action,
  ) => {
    return reducers.reduce(function reduceReducer(s, r) {
      return r({ ...s, ...r }, { ...action, ...r }, init);
    }, nextState);
  };
  const [state, dispatch] = useReducer<
    ReactReducer<State, Action>,
    ActionTypes
  >(
    combineReducers as ReactReducer<State, Action>,
    // @ts-ignore
    init(),
    init,
  );

  return [state, dispatch];
}

export function generateActionTypeMap<T extends string>(
  actionTypes: Array<T>,
): { [K in T]: K } {
  return actionTypes.reduce((types, t) => {
    types[t] = t;
    return types;
  }, Object.create(null));
}
