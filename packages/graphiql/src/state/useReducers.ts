import { useReducer, Reducer as ReactReducer } from 'react';

export type ActionDefault = { payload?: any; [key: string]: any };

export type Reducer<S, AT, A = ActionDefault> = (
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
  [actionType: keyof AT]: Effect<S, AT, A>[];
};

export type UseReducersArgs<S, AT, A> = {
  reducers: Reducer<S, AT, A>[];
  init: (args: Partial<S>) => S;
  effects?: Effects<S, AT, A>;
};

export type DispatchWithEffects<AT, A> = (action: ReducerAction<AT, A>) => void;

export function useReducers<State, ActionTypes, Action>({
  reducers = [],
  init = (args: Partial<State>): State => Object.create(args || null),
  effects,
}: UseReducersArgs<State, ActionTypes, Action>): [
  State,
  DispatchWithEffects<ActionTypes, Action>,
] {
  const [state, dispatch] = useReducer<
    ReactReducer<State, Action>,
    ActionTypes
  >(
    function combineReducers(nextState: State, action: ActionDefault) {
      return reducers.reduce(function reduceReducer(s, r) {
        return r({ ...s, ...r }, { ...action, ...r }, init);
      }, nextState);
    },
    init(),
    init,
  );

  const dispatchWithEffects: DispatchWithEffects<ActionTypes, Action> = async ({
    type,
    ...args
  }) => {
    const effectsForType = effects && effects[type];
    await dispatch({ type, ...args });
    if (effectsForType && Array.isArray(effectsForType)) {
      const runEffects = effectsForType.map(async e =>
        e({ state, action: args, dispatch }),
      );
      await Promise.all(runEffects).catch(e => console.error(e));
    }
  };

  return [state, dispatchWithEffects];
}

export function generateActionTypeMap<T extends string>(
  actionTypes: Array<T>,
): { [K in T]: K } {
  return actionTypes.reduce((types, t) => {
    types[t] = t;
    return types;
  }, Object.create(null));
}
