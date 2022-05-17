import { createContext, ReactNode, useState } from 'react';

import { CodeMirrorEditor } from './types';

export type EditorContextType = {
  headerEditor: CodeMirrorEditor | null;
  queryEditor: CodeMirrorEditor | null;
  setHeaderEditor(newEditor: CodeMirrorEditor): void;
  setQueryEditor(newEditor: CodeMirrorEditor): void;
};

export const EditorContext = createContext<EditorContextType>({
  headerEditor: null,
  queryEditor: null,
  setHeaderEditor() {},
  setQueryEditor() {},
});

export function EditorContextProvider(props: {
  children: ReactNode;
  initialValue?: string;
}) {
  const [headerEditor, setHeaderEditor] = useState<CodeMirrorEditor | null>(
    null,
  );
  const [queryEditor, setQueryEditor] = useState<CodeMirrorEditor | null>(null);
  return (
    <EditorContext.Provider
      value={{ headerEditor, queryEditor, setHeaderEditor, setQueryEditor }}>
      {props.children}
    </EditorContext.Provider>
  );
}
