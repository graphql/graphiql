import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';
import { useEffect, useRef } from 'react';

import { useExecutionStore } from '../execution';
import {
  commonKeys,
  DEFAULT_EDITOR_THEME,
  DEFAULT_KEY_MAP,
  importCodeMirror,
} from './common';
import { useEditorStore } from './context';
import {
  useChangeHandler,
  useCompletion,
  useKeyMap,
  mergeQuery,
  prettifyEditors,
  useSynchronizeOption,
} from './hooks';
import { WriteableEditorProps } from './types';
import { KEY_MAP } from '../constants';

export type UseVariableEditorArgs = WriteableEditorProps & {
  /**
   * Invoked when a reference to the GraphQL schema (type or field) is clicked
   * as part of the editor or one of its tooltips.
   * @param reference The reference that has been clicked.
   */
  onClickReference?(reference: SchemaReference): void;
  /**
   * Invoked when the contents of the variables' editor change.
   * @param value The new contents of the editor.
   */
  onEdit?(value: string): void;
};

// To make react-compiler happy, otherwise complains about using dynamic imports in Component
function importCodeMirrorImports() {
  return importCodeMirror([
    import('codemirror-graphql/esm/variables/hint.js'),
    import('codemirror-graphql/esm/variables/lint.js'),
    import('codemirror-graphql/esm/variables/mode.js'),
  ]);
}

export function useVariableEditor({
  editorTheme = DEFAULT_EDITOR_THEME,
  keyMap = DEFAULT_KEY_MAP,
  onClickReference,
  onEdit,
  readOnly = false,
}: UseVariableEditorArgs = {}) {
  const { initialVariables, variableEditor, setVariableEditor } =
    useEditorStore();
  const run = useExecutionStore(store => store.run);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let isActive = true;

    void importCodeMirrorImports().then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }
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
      function showHint() {
        newEditor.showHint({ completeSingle: false, container });
      }

      newEditor.addKeyMap({
        'Cmd-Space': showHint,
        'Ctrl-Space': showHint,
        'Alt-Space': showHint,
        'Shift-Space': showHint,
      });

      newEditor.on('keyup', (editorInstance, event) => {
        const { code, key, shiftKey } = event;
        const isLetter = code.startsWith('Key');
        const isNumber = !shiftKey && code.startsWith('Digit');
        if (isLetter || isNumber || key === '_' || key === '"') {
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

  useChangeHandler(variableEditor, onEdit, STORAGE_KEY, 'variables');

  useCompletion(variableEditor, onClickReference);

  useKeyMap(variableEditor, ['Cmd-Enter', 'Ctrl-Enter'], run);
  useKeyMap(variableEditor, KEY_MAP.prettify, prettifyEditors);
  useKeyMap(variableEditor, KEY_MAP.mergeFragments, mergeQuery);

  return ref;
}

export const STORAGE_KEY = 'variables';
