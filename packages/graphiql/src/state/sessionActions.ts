import { EditorContexts } from './types';

export enum SessionActionTypes {
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

export type SessionAction =
  | OperationRequestedAction
  | EditorLoadedAction
  | OperationChangedAction
  | VariablesChangedAction
  | OperationSucceededAction
  | OperationErroredAction;

export type OperationRequestedAction = {
  type: SessionActionTypes.OperationRequested;
};

export const operationRequestAction = (): OperationRequestedAction => ({
  type: SessionActionTypes.OperationRequested,
});

export type EditorLoadedAction = {
  type: SessionActionTypes.EditorLoaded;
  payload: {
    context: EditorContexts;
    editor: CodeMirror.Editor;
  };
};

export const editorLoadedAction = (
  context: EditorContexts,
  editor: CodeMirror.Editor,
): EditorLoadedAction => ({
  type: SessionActionTypes.EditorLoaded,
  payload: {
    context,
    editor,
  },
});

export type OperationChangedAction = {
  type: SessionActionTypes.OperationChanged;
  payload: ChangeValuePayload;
};

export const operationChangedAction = (
  value: string,
  sessionId: number,
): OperationChangedAction => ({
  type: SessionActionTypes.OperationChanged,
  payload: { value, sessionId },
});

export type VariablesChangedAction = {
  type: SessionActionTypes.VariablesChanged;
  payload: ChangeValuePayload;
};

export const variableChangedAction = (
  value: string,
  sessionId: number,
): VariablesChangedAction => ({
  type: SessionActionTypes.VariablesChanged,
  payload: { value, sessionId },
});

export type OperationSucceededAction = {
  type: SessionActionTypes.OperationSucceeded;
  payload: SuccessPayload;
};

export const operationSucceededAction = (
  result: string,
  sessionId: number,
): OperationSucceededAction => ({
  type: SessionActionTypes.OperationSucceeded,
  payload: {
    result,
    sessionId,
  },
});

export type OperationErroredAction = {
  type: SessionActionTypes.OperationErrored;
  payload: ErrorPayload;
};

export const operationErroredAction = (
  error: Error,
  sessionId: number,
): OperationErroredAction => ({
  type: SessionActionTypes.OperationErrored,
  payload: { error, sessionId },
});
