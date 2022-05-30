import {
  EditorContext,
  EditorContextProvider,
  ExecutionContext,
  ExecutionContextProvider,
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
  useAutoCompleteLeafs,
  useCopyQuery,
  useEditorContext,
  useExecutionContext,
  useExplorerContext,
  useHistoryContext,
  useMergeQuery,
  usePrettifyEditors,
  useSchemaContext,
  useStorageContext,
  useHeaderEditor as _useHeaderEditor,
  useQueryEditor as _useQueryEditor,
  useResponseEditor as _useResponseEditor,
  useVariableEditor as _useVariableEditor,
} from '@graphiql/react';
import type {
  EditorContextType,
  ExecutionContextType,
  ExplorerContextType,
  ExplorerFieldDef,
  ExplorerNavStack,
  ExplorerNavStackItem,
  HistoryContextType,
  ResponseTooltipType,
  SchemaContextType,
  StorageContextType,
  TabsState,
  UseHeaderEditorArgs,
  UseResponseEditorArgs,
  UseQueryEditorArgs,
  UseVariableEditorArgs,
} from '@graphiql/react';
import { useEffect, useRef, useState } from 'react';

export {
  EditorContext,
  EditorContextProvider,
  ExecutionContext,
  ExecutionContextProvider,
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
  useAutoCompleteLeafs,
  useCopyQuery,
  useEditorContext,
  useExecutionContext,
  useExplorerContext,
  useHistoryContext,
  useMergeQuery,
  usePrettifyEditors,
  useSchemaContext,
  useStorageContext,
};

export type {
  EditorContextType,
  ExecutionContextType,
  ExplorerContextType,
  ExplorerFieldDef,
  ExplorerNavStack,
  ExplorerNavStackItem,
  HistoryContextType,
  ResponseTooltipType,
  SchemaContextType,
  StorageContextType,
  TabsState,
  UseHeaderEditorArgs,
  UseResponseEditorArgs,
  UseQueryEditorArgs,
  UseVariableEditorArgs,
};

type Name = 'query' | 'variable' | 'header' | 'response';

const NAME_TO_INITIAL_VALUE: Record<
  Name,
  'initialQuery' | 'initialVariables' | 'initialHeaders' | undefined
> = {
  query: 'initialQuery',
  variable: 'initialVariables',
  header: 'initialHeaders',
  response: undefined,
};

function useMockedEditor(
  name: Name,
  value?: string,
  onEdit?: (newValue: string) => void,
) {
  const editorContext = useEditorContext({ nonNull: true });
  const [code, setCode] = useState(
    value ?? editorContext[NAME_TO_INITIAL_VALUE[name]],
  );
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
}) {
  return useMockedEditor('header', undefined, onEdit);
};

export const useQueryEditor: typeof _useQueryEditor = function useQueryEditor({
  onEdit,
}) {
  return useMockedEditor('query', undefined, onEdit);
};

export const useResponseEditor: typeof _useResponseEditor = function useResponseEditor({
  value,
}) {
  return useMockedEditor('response', value);
};

export const useVariableEditor: typeof _useVariableEditor = function useVariableEditor({
  onEdit,
}) {
  return useMockedEditor('variable', undefined, onEdit);
};
