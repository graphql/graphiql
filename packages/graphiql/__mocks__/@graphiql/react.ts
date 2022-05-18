import {
  EditorContext,
  EditorContextProvider,
  ExplorerContext,
  ExplorerContextProvider,
  useExplorerNavStack,
  useHeaderEditor as _useHeaderEditor,
  useQueryEditor as _useQueryEditor,
} from '@graphiql/react';
import type {
  EditorContextType,
  ExplorerContextType,
  ExplorerFieldDef,
  ExplorerNavStack,
  ExplorerNavStackItem,
  UseHeaderEditorArgs,
  UseQueryEditorArgs,
} from '@graphiql/react';
import { useEffect, useRef, useState } from 'react';

export {
  EditorContext,
  EditorContextProvider,
  ExplorerContext,
  ExplorerContextProvider,
  useExplorerNavStack,
};

export type {
  EditorContextType,
  ExplorerContextType,
  ExplorerFieldDef,
  ExplorerNavStack,
  ExplorerNavStackItem,
  UseHeaderEditorArgs,
  UseQueryEditorArgs,
};

function useMockedEditor(value?: string, onEdit?: (newValue: string) => void) {
  const [code, setCode] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (ref.current.childElementCount > 0) {
      return;
    }

    const mockGutter = document.createElement('div');
    mockGutter.className = 'CodeMirror-gutter';

    const mockTextArea = document.createElement('textarea');
    mockTextArea.className = 'mockCodeMirror';

    const mockWrapper = document.createElement('div');
    mockWrapper.appendChild(mockGutter);
    mockWrapper.appendChild(mockTextArea);

    ref.current.appendChild(mockWrapper);
  });

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const textarea = ref.current.querySelector('.mockCodeMirror');
    if (!(textarea instanceof HTMLTextAreaElement)) {
      return;
    }

    function handleChange(event: Event) {
      const newValue = (event.target as HTMLTextAreaElement).value;
      setCode(newValue);
      onEdit?.(newValue);
    }

    textarea.addEventListener('change', handleChange);
    return () => textarea.removeEventListener('change', handleChange);
  }, [onEdit]);

  useEffect(() => {
    setCode(value);
  }, [value]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const textarea = ref.current.querySelector('.mockCodeMirror');
    if (!(textarea instanceof HTMLTextAreaElement)) {
      return;
    }

    textarea.value = code;
  }, [code]);

  return ref;
}

export const useHeaderEditor: typeof _useHeaderEditor = function useHeaderEditor({
  onEdit,
  value,
}) {
  return useMockedEditor(value, onEdit);
};

export const useQueryEditor: typeof _useQueryEditor = function useQueryEditor({
  onEdit,
  value,
}) {
  return useMockedEditor(value, onEdit);
};
