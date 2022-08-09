import { useEffect, useRef } from 'react';

import { useExecutionContext } from '../execution';
import {
  commonKeys,
  DEFAULT_EDITOR_THEME,
  DEFAULT_KEY_MAP,
  importCodeMirror,
} from './common';
import { useEditorContext } from './context';
import {
  EditCallback,
  useChangeHandler,
  useCompletion,
  useKeyMap,
  useMergeQuery,
  usePrettifyEditors,
  useSynchronizeOption,
} from './hooks';
import { CodeMirrorType, KeyMap } from './types';

export type UseVariableEditorArgs = {
  editorTheme?: string;
  onEdit?: EditCallback;
  readOnly?: boolean;
  keyMap?: KeyMap;
};

export function useVariableEditor({
  editorTheme = DEFAULT_EDITOR_THEME,
  keyMap = DEFAULT_KEY_MAP,
  onEdit,
  readOnly = false,
}: UseVariableEditorArgs = {}) {
  const { initialVariables, variableEditor, setVariableEditor } =
    useEditorContext({
      nonNull: true,
      caller: useVariableEditor,
    });
  const executionContext = useExecutionContext();
  const merge = useMergeQuery({ caller: useVariableEditor });
  const prettify = usePrettifyEditors({ caller: useVariableEditor });
  const ref = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<CodeMirrorType>();

  useEffect(() => {
    let isActive = true;

    importCodeMirror([
      import('codemirror-graphql/esm/variables/hint'),
      import('codemirror-graphql/esm/variables/lint'),
      import('codemirror-graphql/esm/variables/mode'),
    ]).then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }

      codeMirrorRef.current = CodeMirror;

      const container = ref.current;
      if (!container) {
        return;
      }

      const newEditor = CodeMirror(container, {
        value: initialVariables,
        lineNumbers: true,
        tabSize: 2,
        mode: 'graphql-variables',
        theme: editorTheme,
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        readOnly: readOnly ? 'nocursor' : false,
        foldGutter: true,
        lint: {
          // @ts-expect-error
          variableToType: undefined,
        },
        hintOptions: {
          closeOnUnfocus: false,
          completeSingle: false,
          container,
          // @ts-expect-error
          variableToType: undefined,
        },
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        extraKeys: commonKeys,
      });

      newEditor.addKeyMap({
        'Cmd-Space'() {
          newEditor.showHint({ completeSingle: false, container });
        },
        'Ctrl-Space'() {
          newEditor.showHint({ completeSingle: false, container });
        },
        'Alt-Space'() {
          newEditor.showHint({ completeSingle: false, container });
        },
        'Shift-Space'() {
          newEditor.showHint({ completeSingle: false, container });
        },
      });

      newEditor.on('keyup', (editorInstance, event) => {
        const code = event.keyCode;
        if (
          (code >= 65 && code <= 90) || // letters
          (!event.shiftKey && code >= 48 && code <= 57) || // numbers
          (event.shiftKey && code === 189) || // underscore
          (event.shiftKey && code === 222) // "
        ) {
          editorInstance.execCommand('autocomplete');
        }
      });

      setVariableEditor(newEditor);
    });

    return () => {
      isActive = false;
    };
  }, [editorTheme, initialVariables, readOnly, setVariableEditor]);

  useSynchronizeOption(variableEditor, 'keyMap', keyMap);

  useChangeHandler(
    variableEditor,
    onEdit,
    STORAGE_KEY,
    'variables',
    useVariableEditor,
  );

  useCompletion(variableEditor, useVariableEditor);

  useKeyMap(variableEditor, ['Cmd-Enter', 'Ctrl-Enter'], executionContext?.run);
  useKeyMap(variableEditor, ['Shift-Ctrl-P'], prettify);
  useKeyMap(variableEditor, ['Shift-Ctrl-M'], merge);

  return ref;
}

export const STORAGE_KEY = 'variables';
