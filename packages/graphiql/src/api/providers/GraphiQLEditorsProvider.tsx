import React, { useCallback } from 'react';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import {
  editorLoadedAction,
  EditorActionTypes,
  EditorAction,
} from '../actions/editorActions';

// @ts-ignore
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
// @ts-ignore
import JSONWorker from 'worker-loader!monaco-editor/esm/vs/language/json/json.worker';
// @ts-ignore
import GraphQLWorker from 'worker-loader!../../workers/graphql.worker';

// @ts-ignore
window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'graphqlDev') {
      return new GraphQLWorker();
    }
    if (label === 'json') {
      return new JSONWorker();
    }
    return new EditorWorker();
  },
};

/**
 * Initial State
 */
export type EditorLookup = {
  [editorKey: string]: { editor: monaco.editor.IStandaloneCodeEditor };
};

export type EditorState = { editors: EditorLookup };

export type EditorReducer = React.Reducer<EditorState, EditorAction>;

export type EditorHandlers = {
  loadEditor: (
    editorKey: string,
    editor: monaco.editor.IStandaloneCodeEditor,
  ) => void;
};

export const schemaReducer: EditorReducer = (state, action): EditorState => {
  switch (action.type) {
    case EditorActionTypes.EditorLoaded:
      return {
        ...state,
        editors: {
          ...state.editors,
          [action.payload.editorKey]: { editor: action.payload.editor },
        },
      };
    default: {
      return state;
    }
  }
};

export const EditorContext = React.createContext<EditorState & EditorHandlers>({
  editors: {},
  loadEditor: () => {
    return {};
  },
});

export const useEditorsContext = () => React.useContext(EditorContext);

export function EditorsProvider(props: { children?: any }) {
  const [state, dispatch] = React.useReducer<EditorReducer>(schemaReducer, {
    editors: {},
  });

  const loadEditor = useCallback(
    (editorKey: string, editor: monaco.editor.IStandaloneCodeEditor) => {
      dispatch(editorLoadedAction(editorKey, editor));
    },
    [dispatch],
  );

  return (
    <EditorContext.Provider
      value={{
        ...state,
        loadEditor,
      }}>
      {props.children}
    </EditorContext.Provider>
  );
}
