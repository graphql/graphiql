/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

export enum EditorActionTypes {
  EditorLoaded = 'EditorLoaded',
}

export type EditorAction = EditorLoadedAction;

export const editorLoadedAction = (
  editorKey: string,
  editor: monaco.editor.IStandaloneCodeEditor,
) =>
  ({
    type: EditorActionTypes.EditorLoaded,
    payload: { editor, editorKey },
  } as const);

export type EditorLoadedAction = ReturnType<typeof editorLoadedAction>;
