import { useEffect, useRef } from 'react';

import {
  commonKeys,
  DEFAULT_EDITOR_THEME,
  DEFAULT_KEY_MAP,
  importCodeMirror,
} from './common';
import { useEditorStore, useExecutionStore } from '../stores';
import {
  useChangeHandler,
  useKeyMap,
  mergeQuery,
  prettifyEditors,
  useSynchronizeOption,
} from './hooks';
import { WriteableEditorProps } from './types';
import { KEY_MAP } from '../constants';
import { clsx } from 'clsx';

type HeaderEditorProps = WriteableEditorProps & {
  /**
   * Invoked when the contents of the headers editor change.
   * @param value The new contents of the editor.
   */
  onEdit?(value: string): void;

  /**
   * Visually hide the header editor.
   * @default false
   */
  isHidden?: boolean;
};

// To make react-compiler happy, otherwise complains about using dynamic imports in Component
function importCodeMirrorImports() {
  return importCodeMirror([
    // @ts-expect-error
    import('codemirror/mode/javascript/javascript.js'),
  ]);
}

export function HeaderEditor({
  editorTheme = DEFAULT_EDITOR_THEME,
  keyMap = DEFAULT_KEY_MAP,
  onEdit,
  readOnly = false,
  isHidden = false,
}: HeaderEditorProps) {
  const {
    initialHeaders,
    headerEditor,
    setHeaderEditor,
    shouldPersistHeaders,
  } = useEditorStore();
  const run = useExecutionStore(store => store.run);
  const ref = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    let isActive = true;

    void importCodeMirrorImports().then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }

      const container = ref.current;
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

  useKeyMap(headerEditor, KEY_MAP.runQuery, run);
  useKeyMap(headerEditor, KEY_MAP.prettify, prettifyEditors);
  useKeyMap(headerEditor, KEY_MAP.mergeFragments, mergeQuery);

  useEffect(() => {
    if (!isHidden) {
      headerEditor?.refresh();
    }
  }, [headerEditor, isHidden]);

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
}

export const STORAGE_KEY = 'headers';
