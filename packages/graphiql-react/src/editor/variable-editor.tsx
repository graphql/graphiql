import { useEffect, useRef } from 'react';
import { useExecutionStore, useEditorStore, storageStore } from '../stores';
import { commonKeys, DEFAULT_EDITOR_THEME, DEFAULT_KEY_MAP } from './common';
import {
  useChangeHandler,
  useCompletion,
  useKeyMap,
  mergeQuery,
  prettifyEditors,
  useSynchronizeOption,
} from './hooks';
import { WriteableEditorProps, SchemaReference } from './types';
import { KEY_MAP, VARIABLES_MODEL } from '../constants';
import { clsx } from 'clsx';
import { createEditor } from '../create-editor';
import { debounce } from '../utility';

type VariableEditorProps = WriteableEditorProps & {
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
  /**
   * Visually hide the header editor.
   * @default false
   */
  isHidden?: boolean;
};

export function VariableEditor({
  editorTheme = DEFAULT_EDITOR_THEME,
  keyMap = DEFAULT_KEY_MAP,
  onClickReference,
  onEdit,
  readOnly = false,
  isHidden = false,
}: VariableEditorProps) {
  const {
    initialVariables,
    variableEditor,
    setVariableEditor,
    updateActiveTabValues,
  } = useEditorStore();
  const run = useExecutionStore(store => store.run);
  const ref = useRef<HTMLDivElement>(null!);
  /*
  useEffect(() => {
    let isActive = true;

    void importCodeMirrorImports().then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }
      const container = ref.current;
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

  useKeyMap(variableEditor, KEY_MAP.runQuery, run);
  useKeyMap(variableEditor, KEY_MAP.prettify, prettifyEditors);
  useKeyMap(variableEditor, KEY_MAP.mergeFragments, mergeQuery);

  useEffect(() => {
    if (!isHidden) {
      variableEditor?.refresh();
    }
  }, [variableEditor, isHidden]);
  */
  useEffect(() => {
    setVariableEditor(createEditor('variables', ref.current));
    VARIABLES_MODEL.onDidChangeContent(
      debounce(500, () => {
        const value = VARIABLES_MODEL.getValue();
        const { storage } = storageStore.getState();
        storage.set(STORAGE_KEY, value);
        updateActiveTabValues({ variables: value });
      }),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
}

export const STORAGE_KEY = 'variables';
