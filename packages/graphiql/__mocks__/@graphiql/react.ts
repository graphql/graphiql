import {
  EditorContext,
  EditorContextProvider,
  ExplorerContext,
  ExplorerContextProvider,
  HistoryContext,
  HistoryContextProvider,
  ImagePreview,
  onHasCompletion,
  SchemaContext,
  SchemaContextProvider,
  StorageContext,
  StorageContextProvider,
  useCopyQuery,
  useEditorContext,
  useExplorerContext,
  useHistoryContext,
  useMergeQuery,
  useSchemaContext,
  useStorageContext,
  useHeaderEditor as _useHeaderEditor,
  useQueryEditor as _useQueryEditor,
  useResponseEditor as _useResponseEditor,
  useVariableEditor as _useVariableEditor,
} from '@graphiql/react';
import type {
  EditorContextType,
  ExplorerContextType,
  ExplorerFieldDef,
  ExplorerNavStack,
  ExplorerNavStackItem,
  HistoryContextType,
  ResponseTooltipType,
  SchemaContextType,
  StorageContextType,
  UseHeaderEditorArgs,
  UseResponseEditorArgs,
  UseQueryEditorArgs,
  UseVariableEditorArgs,
} from '@graphiql/react';
import { useEffect, useRef, useState } from 'react';

export {
  EditorContext,
  EditorContextProvider,
  ExplorerContext,
  ExplorerContextProvider,
  HistoryContext,
  HistoryContextProvider,
  ImagePreview,
  onHasCompletion,
  SchemaContext,
  SchemaContextProvider,
  StorageContext,
  StorageContextProvider,
  useCopyQuery,
  useEditorContext,
  useExplorerContext,
  useHistoryContext,
  useMergeQuery,
  useSchemaContext,
  useStorageContext,
};

export type {
  EditorContextType,
  ExplorerContextType,
  ExplorerFieldDef,
  ExplorerNavStack,
  ExplorerNavStackItem,
  HistoryContextType,
  ResponseTooltipType,
  SchemaContextType,
  StorageContextType,
  UseHeaderEditorArgs,
  UseResponseEditorArgs,
  UseQueryEditorArgs,
  UseVariableEditorArgs,
};

function useMockedEditor(
  name: string,
  value?: string,
  onEdit?: (newValue: string) => void,
  defaultValue?: string,
) {
  const [code, setCode] = useState(value ?? defaultValue);
  const ref = useRef<HTMLDivElement>(null);

  const context = useEditorContext({ nonNull: true });
  const setEditor =
    context[`set${name.slice(0, 1).toUpperCase()}${name.slice(1)}Editor`];

  const getValueRef = useRef<() => string>();
  useEffect(() => {
    getValueRef.current = () => code;
  }, [code]);

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

    setEditor({
      getValue() {
        return getValueRef.current();
      },
      setValue(newValue: string) {
        setCode(newValue);
      },
    });
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
    if (value) {
      setCode(value);
    }
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
  return useMockedEditor('header', value, onEdit);
};

export const useQueryEditor: typeof _useQueryEditor = function useQueryEditor({
  defaultValue = '# Welcome to GraphiQL',
  onEdit,
  value,
}) {
  return useMockedEditor('query', value, onEdit, defaultValue);
};

export const useResponseEditor: typeof _useResponseEditor = function useResponseEditor({
  value,
}) {
  return useMockedEditor('response', value);
};

export const useVariableEditor: typeof _useVariableEditor = function useVariableEditor({
  onEdit,
  value,
}) {
  return useMockedEditor('variable', value, onEdit);
};
