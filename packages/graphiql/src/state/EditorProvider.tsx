import React from 'react';

import { EditorContexts } from './types';
import useDispatchedCallback from '../hooks/useDispatchedCallback';

interface EditorState {
  editor?: CodeMirror.Editor;
  text?: string;
}
const initialState: EditorState = {};

enum EditorActionType {
  Load = 'load',
  Change = 'change',
}

const editorChangeAction = (payload: string) =>
  ({
    type: EditorActionType.Change,
    payload,
  } as const);

const editorLoadedAction = (payload: CodeMirror.Editor) =>
  ({
    type: EditorActionType.Load,
    payload,
  } as const);

type EditorAction =
  | ReturnType<typeof editorChangeAction>
  | ReturnType<typeof editorLoadedAction>;

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case EditorActionType.Load: {
      return {
        ...state,
        editor: action.payload,
      };
    }
    case EditorActionType.Change: {
      return {
        ...state,
        text: action.payload,
      };
    }
    default: {
      return state;
    }
  }
}

type EditorContextType =
  | (EditorState & {
      context: EditorContexts;
      onLoadEditor: (...args: Parameters<typeof editorLoadedAction>) => void;
      onChange: (...args: Parameters<typeof editorChangeAction>) => void;
    })
  | undefined;

const EditorContext = React.createContext<EditorContextType>(undefined);

export const useEditorContext = () => React.useContext(EditorContext);

type EditorProviderProps = {
  context: EditorContexts;
  children: React.ReactNode;
};

export function EditorProvider({ context, children }: EditorProviderProps) {
  const [state, dispatch] = React.useReducer(editorReducer, initialState);

  const onLoadEditor = useDispatchedCallback(dispatch, editorLoadedAction);
  const onChange = useDispatchedCallback(dispatch, editorChangeAction);

  return (
    <EditorContext.Provider
      value={{
        ...state,
        context,
        onLoadEditor,
        onChange,
      }}>
      {children}
    </EditorContext.Provider>
  );
}
