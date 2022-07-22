import {
  useEditorContext,
  HeaderEditor as _HeaderEditor,
  QueryEditor as _QueryEditor,
  ResponseEditor as _ResponseEditor,
  VariableEditor as _VariableEditor,
  useHeaderEditor as _useHeaderEditor,
  useQueryEditor as _useQueryEditor,
  useResponseEditor as _useResponseEditor,
  useVariableEditor as _useVariableEditor,
} from '@graphiql/react';
import React, { useEffect, useRef, useState } from 'react';

export {
  Argument,
  ArgumentIcon,
  Button,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  CloseIcon,
  CopyIcon,
  DefaultValue,
  DeprecatedArgumentIcon,
  DeprecatedEnumValueIcon,
  DeprecatedFieldIcon,
  Directive,
  DirectiveIcon,
  DocExplorer,
  DocsIcon,
  Dropdown,
  EditorContext,
  EditorContextProvider,
  EnumValueIcon,
  ExecuteButton,
  ExecutionContext,
  ExecutionContextProvider,
  ExplorerContext,
  ExplorerContextProvider,
  ExplorerSection,
  FieldDocumentation,
  FieldIcon,
  FieldLink,
  History,
  HistoryContext,
  HistoryContextProvider,
  HistoryIcon,
  ImagePreview,
  ImplementsIcon,
  KeyboardShortcutIcon,
  MagnifyingGlassIcon,
  MarkdownContent,
  MergeIcon,
  onHasCompletion,
  PenIcon,
  PlayIcon,
  PrettifyIcon,
  RootTypeIcon,
  SchemaContext,
  SchemaContextProvider,
  SchemaDocumentation,
  Search,
  SettingsIcon,
  Spinner,
  StarFilledIcon,
  StarIcon,
  StopIcon,
  StorageContext,
  StorageContextProvider,
  ToolbarButton,
  TypeDocumentation,
  TypeIcon,
  TypeLink,
  UnStyledButton,
  useAutoCompleteLeafs,
  useCopyQuery,
  useDragResize,
  useEditorContext,
  useExecutionContext,
  useExplorerContext,
  useHistoryContext,
  useMergeQuery,
  usePrettifyEditors,
  useSchemaContext,
  useStorageContext,
} from '@graphiql/react';

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
} from '@graphiql/react';

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
  const [code, setCode] = useState(() => {
    const initialValueProp = NAME_TO_INITIAL_VALUE[name];
    return (
      value ??
      (initialValueProp ? editorContext[initialValueProp] : undefined) ??
      ''
    );
  });
  const ref = useRef<HTMLDivElement>(null);

  const setEditor =
    editorContext[`set${name.slice(0, 1).toUpperCase()}${name.slice(1)}Editor`];

  const getValueRef = useRef<() => string>(() => code);
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
      refresh() {},
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

export const useHeaderEditor: typeof _useHeaderEditor = function useHeaderEditor(
  props,
) {
  return useMockedEditor('header', undefined, props?.onEdit);
};

export const useQueryEditor: typeof _useQueryEditor = function useQueryEditor(
  props,
) {
  return useMockedEditor('query', undefined, props?.onEdit);
};

export const useResponseEditor: typeof _useResponseEditor = function useResponseEditor(
  props,
) {
  return useMockedEditor('response', props?.value);
};

export const useVariableEditor: typeof _useVariableEditor = function useVariableEditor(
  props,
) {
  return useMockedEditor('variable', undefined, props?.onEdit);
};

export const HeaderEditor: typeof _HeaderEditor = function HeaderEditor(props) {
  const ref = useHeaderEditor(props);
  return <div ref={ref} />;
};

export const QueryEditor: typeof _QueryEditor = function QueryEditor(props) {
  const ref = useQueryEditor(props);
  return <div data-testid="query-editor" ref={ref} />;
};

export const ResponseEditor: typeof _ResponseEditor = function ResponseEditor(
  props,
) {
  const ref = useResponseEditor(props);
  return <div ref={ref} />;
};

export const VariableEditor: typeof _VariableEditor = function VariableEditor(
  props,
) {
  const ref = useVariableEditor(props);
  return <div ref={ref} />;
};
