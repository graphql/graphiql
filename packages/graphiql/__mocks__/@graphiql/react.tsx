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
import { useEffect, useRef, useState } from 'react';

export {
  Argument,
  ArgumentIcon,
  Button,
  ButtonGroup,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  CloseIcon,
  CopyIcon,
  DefaultValue,
  DeprecatedArgumentIcon,
  DeprecatedEnumValueIcon,
  DeprecatedFieldIcon,
  DeprecationReason,
  Dialog,
  Directive,
  DirectiveIcon,
  DOC_EXPLORER_PLUGIN,
  DocExplorer,
  DocsFilledIcon,
  DocsIcon,
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
  GraphiQLProvider,
  History,
  HISTORY_PLUGIN,
  HistoryContext,
  HistoryContextProvider,
  HistoryIcon,
  ImagePreview,
  ImplementsIcon,
  KeyboardShortcutIcon,
  Listbox,
  MagnifyingGlassIcon,
  MarkdownContent,
  Menu,
  MergeIcon,
  PenIcon,
  PlayIcon,
  PluginContext,
  PluginContextProvider,
  PlusIcon,
  PrettifyIcon,
  ReloadIcon,
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
  Tab,
  Tabs,
  ToolbarButton,
  ToolbarListbox,
  ToolbarMenu,
  Tooltip,
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
  usePluginContext,
  usePrettifyEditors,
  useSchemaContext,
  useStorageContext,
  useTheme,
} from '@graphiql/react';

export type {
  CommonEditorProps,
  EditorContextProviderProps,
  EditorContextType,
  ExecutionContextProviderProps,
  ExecutionContextType,
  ExplorerContextProviderProps,
  ExplorerContextType,
  ExplorerFieldDef,
  ExplorerNavStack,
  ExplorerNavStackItem,
  GraphiQLPlugin,
  GraphiQLProviderProps,
  HistoryContextProviderProps,
  HistoryContextType,
  KeyMap,
  PluginContextProviderProps,
  PluginContextType,
  ResponseTooltipType,
  SchemaContextProviderProps,
  SchemaContextType,
  StorageContextProviderProps,
  StorageContextType,
  TabsState,
  Theme,
  UseHeaderEditorArgs,
  UseQueryEditorArgs,
  UseResponseEditorArgs,
  UseVariableEditorArgs,
  WriteableEditorProps,
} from '@graphiql/react';

type Name = 'query' | 'variable' | 'header' | 'response';

const NAME_TO_INITIAL_VALUE = {
  query: 'initialQuery',
  variable: 'initialVariables',
  header: 'initialHeaders',
  response: 'initialResponse',
} as const;

function useMockedEditor(name: Name, onEdit?: (newValue: string) => void) {
  const editorContext = useEditorContext({ nonNull: true });
  const [code, setCode] = useState(editorContext[NAME_TO_INITIAL_VALUE[name]]);
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
    mockWrapper.append(mockGutter, mockTextArea);

    ref.current.append(mockWrapper);

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

export const useHeaderEditor: typeof _useHeaderEditor =
  function useHeaderEditor(args) {
    return useMockedEditor('header', args?.onEdit);
  };

export const useQueryEditor: typeof _useQueryEditor = function useQueryEditor(
  args,
) {
  return useMockedEditor('query', args?.onEdit);
};

export const useResponseEditor: typeof _useResponseEditor =
  function useResponseEditor() {
    return useMockedEditor('response');
  };

export const useVariableEditor: typeof _useVariableEditor =
  function useVariableEditor(args) {
    return useMockedEditor('variable', args?.onEdit);
  };

export const HeaderEditor: typeof _HeaderEditor = function HeaderEditor(props) {
  const ref = useHeaderEditor(props);
  return <div ref={ref} />;
};

export const QueryEditor: typeof _QueryEditor = function QueryEditor(props) {
  const ref = useQueryEditor(props);
  return <div data-testid="query-editor" ref={ref} />;
};

export const ResponseEditor: typeof _ResponseEditor =
  function ResponseEditor() {
    const ref = useResponseEditor();
    return <div ref={ref} />;
  };

export const VariableEditor: typeof _VariableEditor = function VariableEditor(
  props,
) {
  const ref = useVariableEditor(props);
  return <div ref={ref} />;
};
