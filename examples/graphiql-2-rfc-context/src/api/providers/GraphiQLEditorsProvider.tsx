/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback } from 'react';

import {
  editorLoadedAction,
  EditorActionTypes,
  EditorAction,
} from '../actions/editorActions';

import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
import JSONWorker from 'worker-loader!monaco-editor/esm/vs/language/json/json.worker';
import GraphQLWorker from 'worker-loader!../../workers/graphql.worker';

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

export const editorReducer: EditorReducer = (state, action): EditorState => {
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
  const [state, dispatch] = React.useReducer<EditorReducer>(editorReducer, {
    editors: {},
  });

  const loadEditor = useCallback(
    (editorKey: string, editor: monaco.editor.IStandaloneCodeEditor) => {
      dispatch(editorLoadedAction(editorKey, editor));
    },
    [],
  );

  return (
    <EditorContext.Provider
      value={{
        ...state,
        loadEditor,
      }}
    >
      {props.children}
    </EditorContext.Provider>
  );
}
