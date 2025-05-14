import { useEffect, useRef } from 'react';

import {
  commonKeys,
  DEFAULT_EDITOR_THEME,
  DEFAULT_KEY_MAP,
  importCodeMirror,
} from './common';
import { useEditorStore } from './context';
import {
  useChangeHandler,
  useKeyMap,
  mergeQuery,
  prettifyEditors,
  useSynchronizeOption,
} from './hooks';
import { WriteableEditorProps } from './types';
import { useExecutionStore } from '../execution';

export type UseHeaderEditorArgs = WriteableEditorProps & {
  /**
   * Invoked when the contents of the headers editor change.
   * @param value The new contents of the editor.
   */
  onEdit?(value: string): void;
};

// To make react-compiler happy, otherwise complains about using dynamic imports in Component
function importCodeMirrorImports() {
  return importCodeMirror([
    // @ts-expect-error
    import('codemirror/mode/javascript/javascript.js'),
  ]);
}

export function useHeaderEditor({
  editorTheme = DEFAULT_EDITOR_THEME,
  keyMap = DEFAULT_KEY_MAP,
  onEdit,
  readOnly = false,
}: UseHeaderEditorArgs = {}) {
  const {
    initialHeaders,
    headerEditor,
    setHeaderEditor,
    shouldPersistHeaders,
  } = useEditorStore();
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
        value: initialHeaders,
        lineNumbers: true,
        tabSize: 2,
        mode: { name: 'javascript', json: true },
        theme: editorTheme,
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        readOnly: readOnly ? 'nocursor' : false,
        foldGutter: true,
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

      setHeaderEditor(newEditor);
    });

    return () => {
      isActive = false;
    };
  }, [editorTheme, initialHeaders, readOnly, setHeaderEditor]);

  useSynchronizeOption(headerEditor, 'keyMap', keyMap);

  useChangeHandler(
    headerEditor,
    onEdit,
    shouldPersistHeaders ? STORAGE_KEY : null,
    'headers',
  );

  useKeyMap(headerEditor, ['Cmd-Enter', 'Ctrl-Enter'], run);
  useKeyMap(headerEditor, ['Shift-Ctrl-P'], prettifyEditors);
  useKeyMap(headerEditor, ['Shift-Ctrl-M'], mergeQuery);

  return ref;
}

export const STORAGE_KEY = 'headers';
