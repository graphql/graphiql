import { EditorContexts } from './types';

export enum ActionTypes {
  OperationRequested = 'OperationRequested',
  EditorLoaded = 'EditorLoaded',
  OperationChanged = 'OperationChanged',
  VariablesChanged = 'VariablesChanged',
  OperationSucceeded = 'OperationSucceeded',
  OperationErrored = 'OperationErrored',
}

export type ErrorPayload = { error: Error; sessionId: number };
export type SuccessPayload = { sessionId: number; result: string };
export type ChangeValuePayload = { sessionId: number; value: string };

export type Action =
  | OperationRequestedAction
  | EditorLoadedAction
  | OperationChangedAction
  | VariablesChangedAction
  | OperationSucceededAction
  | OperationErroredAction;

export type OperationRequestedAction = {
  type: ActionTypes.OperationRequested;
};

export type EditorLoadedAction = {
  type: ActionTypes.EditorLoaded;
  payload: {
    context: EditorContexts;
    editor: CodeMirror.Editor;
  };
};

export type OperationChangedAction = {
  type: ActionTypes.OperationChanged;
  payload: ChangeValuePayload;
};

export type VariablesChangedAction = {
  type: ActionTypes.VariablesChanged;
  payload: ChangeValuePayload;
};

export type OperationSucceededAction = {
  type: ActionTypes.OperationSucceeded;
  payload: SuccessPayload;
};

export type OperationErroredAction = {
  type: ActionTypes.OperationErrored;
  payload: ErrorPayload;
};
