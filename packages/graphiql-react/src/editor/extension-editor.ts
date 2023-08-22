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
  useChangeHandler,
  useKeyMap,
  useMergeQuery,
  usePrettifyEditors,
  useSynchronizeOption,
} from './hooks';
import { WriteableEditorProps } from './types';

export type UseExtensionEditorArgs = WriteableEditorProps & {
  /**
   * Invoked when the contents of the extension editor change.
   * @param value The new contents of the editor.
   */
  onEdit?(value: string): void;
};

export function useExtensionEditor(
    {
      editorTheme = DEFAULT_EDITOR_THEME,
      keyMap = DEFAULT_KEY_MAP,
      onEdit,
      readOnly = false,
    }: UseExtensionEditorArgs = {},
    caller?: Function,
) {
  const {
    initialExtensions,
    extensionEditor,
    setExtensionEditor,
  } = useEditorContext({
    nonNull: true,
    caller: caller || useExtensionEditor,
  });
  const executionContext = useExecutionContext();
  const merge = useMergeQuery({ caller: caller || useExtensionEditor });
  const prettify = usePrettifyEditors({ caller: caller || useExtensionEditor });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isActive = true;

    void importCodeMirror([
      // @ts-expect-error
      import('codemirror/mode/javascript/javascript'),
    ]).then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }

      const container = ref.current;
      if (!container) {
        return;
      }

      const newEditor = CodeMirror(container, {
        value: initialExtensions,
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
        const { code, key, shiftKey } = event;
        const isLetter = code.startsWith('Key');
        const isNumber = !shiftKey && code.startsWith('Digit');
        if (isLetter || isNumber || key === '_' || key === '"') {
          editorInstance.execCommand('autocomplete');
        }
      });

      setExtensionEditor(newEditor);
    });

    return () => {
      isActive = false;
    };
  }, [editorTheme, initialExtensions, readOnly, setExtensionEditor]);

  useSynchronizeOption(extensionEditor, 'keyMap', keyMap);

  useChangeHandler(
      extensionEditor,
      onEdit,
      STORAGE_KEY,
      'extensions',
      useExtensionEditor,
  );

  useKeyMap(extensionEditor, ['Cmd-Enter', 'Ctrl-Enter'], executionContext?.run);
  useKeyMap(extensionEditor, ['Shift-Ctrl-P'], prettify);
  useKeyMap(extensionEditor, ['Shift-Ctrl-M'], merge);

  return ref;
}

export const STORAGE_KEY = 'extensions';
