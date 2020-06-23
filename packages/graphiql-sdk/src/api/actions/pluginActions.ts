export enum PluginActionTypes {
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
