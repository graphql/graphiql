import { useContext, useEffect, useRef } from 'react';

import { StorageContext } from '../storage';
import { commonKeys, importCodeMirror } from './common';
import { EditorContext } from './context';
import {
  CompletionCallback,
  EditCallback,
  EmptyCallback,
  useChangeHandler,
  useCompletion,
  useKeyMap,
  useResizeEditor,
  useSynchronizeValue,
} from './hooks';
import { CodeMirrorType } from './types';

export type UseVariableEditorArgs = {
  editorTheme?: string;
  onEdit?: EditCallback;
  onHintInformationRender?: CompletionCallback;
  onPrettifyQuery?: EmptyCallback;
  onMergeQuery?: EmptyCallback;
  onRunQuery?: EmptyCallback;
  readOnly?: boolean;
  value?: string;
};

export function useVariableEditor({
  editorTheme = 'graphiql',
  onEdit,
  onHintInformationRender,
  onMergeQuery,
  onPrettifyQuery,
  onRunQuery,
  readOnly = false,
  value,
}: UseVariableEditorArgs = {}) {
  const context = useContext(EditorContext);
  const storage = useContext(StorageContext);
  const ref = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<CodeMirrorType>();

  if (!context) {
    throw new Error(
      'Tried to call the `useVariableEditor` hook without the necessary context. Make sure that the `EditorContextProvider` from `@graphiql/react` is rendered higher in the tree.',
    );
  }

  const { variableEditor, setVariableEditor } = context;

  const initialValue = useRef(value ?? storage?.get(STORAGE_KEY) ?? '');

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
        value: initialValue.current || '',
        lineNumbers: true,
        tabSize: 2,
        mode: 'graphql-variables',
        theme: editorTheme,
        keyMap: 'sublime',
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
  }, [editorTheme, readOnly, setVariableEditor]);

  useSynchronizeValue(variableEditor, value);

  useChangeHandler(variableEditor, onEdit, STORAGE_KEY);

  useCompletion(variableEditor, onHintInformationRender);

  useKeyMap(variableEditor, ['Cmd-Enter', 'Ctrl-Enter'], onRunQuery);
  useKeyMap(variableEditor, ['Shift-Ctrl-P'], onPrettifyQuery);
  useKeyMap(variableEditor, ['Shift-Ctrl-M'], onMergeQuery);

  useResizeEditor(variableEditor, ref);

  return ref;
}

const STORAGE_KEY = 'variables';
