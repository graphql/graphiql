import type { Editor } from 'codemirror';
import { createContext, ReactNode, useState } from 'react';

export type EditorContextType = {
  headerEditor: Editor | null;
  setHeaderEditor(newEditor: Editor): void;
};

export const EditorContext = createContext<EditorContextType>({
  headerEditor: null,
  setHeaderEditor() {},
});

export function EditorContextProvider(props: {
  children: ReactNode;
  initialValue?: string;
}) {
  const [editor, setEditor] = useState<Editor | null>(null);
  return (
    <EditorContext.Provider
      value={{ headerEditor: editor, setHeaderEditor: setEditor }}>
      {props.children}
    </EditorContext.Provider>
  );
}
