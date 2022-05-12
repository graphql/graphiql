export enum BrowserActionTypes {
  QueryStringParamsChanged = 'QueryStringParamsChanged',
}

export type BrowserAction = QueryStringParamsChangedAction;

export const queryStringParamsChangedAction = (
  parameter: string,
  value: string,
) =>
  ({
    type: BrowserActionTypes.QueryStringParamsChanged,
    payload: { parameter, value },
  } as const);

export type QueryStringParamsChangedAction = ReturnType<
  typeof queryStringParamsChangedAction
>;
