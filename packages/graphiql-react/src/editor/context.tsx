import { createContext, ReactNode, useState } from 'react';

import { CodeMirrorEditor } from './types';

export type EditorContextType = {
  headerEditor: CodeMirrorEditor | null;
  queryEditor: CodeMirrorEditor | null;
  resultEditor: CodeMirrorEditor | null;
  variableEditor: CodeMirrorEditor | null;
  setHeaderEditor(newEditor: CodeMirrorEditor): void;
  setQueryEditor(newEditor: CodeMirrorEditor): void;
  setResultEditor(newEditor: CodeMirrorEditor): void;
  setVariableEditor(newEditor: CodeMirrorEditor): void;
};

export const EditorContext = createContext<EditorContextType>({
  headerEditor: null,
  queryEditor: null,
  resultEditor: null,
  variableEditor: null,
  setHeaderEditor() {},
  setQueryEditor() {},
  setResultEditor() {},
  setVariableEditor() {},
});

export function EditorContextProvider(props: {
  children: ReactNode;
  initialValue?: string;
}) {
  const [headerEditor, setHeaderEditor] = useState<CodeMirrorEditor | null>(
    null,
  );
  const [queryEditor, setQueryEditor] = useState<CodeMirrorEditor | null>(null);
  const [resultEditor, setResultEditor] = useState<CodeMirrorEditor | null>(
    null,
  );
  const [variableEditor, setVariableEditor] = useState<CodeMirrorEditor | null>(
    null,
  );
  return (
    <EditorContext.Provider
      value={{
        headerEditor,
        queryEditor,
        resultEditor,
        variableEditor,
        setHeaderEditor,
        setQueryEditor,
        setResultEditor,
        setVariableEditor,
      }}>
      {props.children}
    </EditorContext.Provider>
  );
}
