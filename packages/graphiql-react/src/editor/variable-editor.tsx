import { useEffect, useRef } from 'react';
import {
  useExecutionStore,
  useEditorStore,
  storageStore,
  editorStore,
} from '../stores';
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
import { KEY_BINDINGS, KEY_MAP } from '../constants';
import { clsx } from 'clsx';
import { createEditor } from '../create-editor';
import { debounce } from '../utility';
import { KeyCode, KeyMod } from 'monaco-editor';

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
  onClickReference,
  onEdit,
  readOnly = false,
  isHidden = false,
}: VariableEditorProps) {
  const { initialVariables } = useEditorStore();
  const run = useExecutionStore(store => store.run);
  const ref = useRef<HTMLDivElement>(null!);
  /*
  useEffect(() => {
    void importCodeMirrorImports().then(CodeMirror => {
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
          variableToType: undefined,
        },
        hintOptions: {
          closeOnUnfocus: false,
          completeSingle: false,
          container,
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
  }, [editorTheme, initialVariables, readOnly, setVariableEditor]);

  useChangeHandler(variableEditor, onEdit, STORAGE_KEY, 'variables');

  useCompletion(variableEditor, onClickReference);

  useEffect(() => {
    if (!isHidden) {
      variableEditor?.refresh();
    }
  }, [variableEditor, isHidden]);
  */
  useEffect(() => {
    const { setEditor, updateActiveTabValues } = editorStore.getState();
    // Build the editor
    const editor = createEditor('variable', ref);
    setEditor({ variableEditor: editor });
    const { storage } = storageStore.getState();
    const model = editor.getModel()!;
    // 2️⃣ Subscribe to content changes
    const disposables = [
      model.onDidChangeContent(
        debounce(500, () => {
          const value = model.getValue();
          console.log('storage', storage);
          storage.set(STORAGE_KEY, value);
          updateActiveTabValues({ variables: value });
        }),
      ),
      editor.addAction(KEY_BINDINGS.runQuery),
      editor.addAction(KEY_BINDINGS.prettify),
      editor.addAction(KEY_BINDINGS.mergeFragments),
      editor,
      model,
    ];

    // 3️⃣ Clean‑up on unmount **or** when deps change
    return () => {
      for (const disposable of disposables) {
        disposable.dispose(); // remove the listener
      }
    };
  }, []);

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
}

export const STORAGE_KEY = 'variables';
