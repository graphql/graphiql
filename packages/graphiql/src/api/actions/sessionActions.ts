import { EditorContexts } from '../types';

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

export const operationRequestAction = () =>
  ({
    type: SessionActionTypes.OperationRequested,
  } as const);

export type OperationRequestedAction = ReturnType<
  typeof operationRequestAction
>;

export const editorLoadedAction = (
  context: EditorContexts,
  editor: CodeMirror.Editor,
) =>
  ({
    type: SessionActionTypes.EditorLoaded,
    payload: {
      context,
      editor,
    },
  } as const);

type EditorLoadedAction = ReturnType<typeof editorLoadedAction>;

export const operationChangedAction = (value: string, sessionId: number) =>
  ({
    type: SessionActionTypes.OperationChanged,
    payload: { value, sessionId },
  } as const);

export type OperationChangedAction = ReturnType<typeof operationChangedAction>;

export const variableChangedAction = (value: string, sessionId: number) =>
  ({
    type: SessionActionTypes.VariablesChanged,
    payload: { value, sessionId },
  } as const);

export type VariablesChangedAction = ReturnType<typeof variableChangedAction>;

export const operationSucceededAction = (result: string, sessionId: number) =>
  ({
    type: SessionActionTypes.OperationSucceeded,
    payload: {
      result,
      sessionId,
    },
  } as const);

export type OperationSucceededAction = ReturnType<
  typeof operationSucceededAction
>;

export const operationErroredAction = (error: Error, sessionId: number) =>
  ({
    type: SessionActionTypes.OperationErrored,
    payload: { error, sessionId },
  } as const);

export type OperationErroredAction = ReturnType<typeof operationErroredAction>;
