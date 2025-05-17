import { useEffect, useRef } from 'react';
import { useEditorStore, storageStore, editorStore } from '../stores';
import { commonKeys, DEFAULT_EDITOR_THEME } from './common';
import { useChangeHandler, useCompletion, useSynchronizeOption } from './hooks';
import { WriteableEditorProps, SchemaReference } from './types';
import { getOrCreateModel, KEY_BINDINGS, VARIABLE_URI } from '../constants';
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
  onClickReference,
  onEdit,
  readOnly = false,
  isHidden = false,
}: VariableEditorProps) {
  const { initialVariables } = useEditorStore();
  const ref = useRef<HTMLDivElement>(null!);
  /*
  useEffect(() => {
    void importCodeMirrorImports().then(CodeMirror => {
      const container = ref.current;
      const newEditor = CodeMirror(container, {
        theme: editorTheme,
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        lint: {
          variableToType: undefined,
        },
        hintOptions: {
          closeOnUnfocus: false,
          completeSingle: false,
          container,
          variableToType: undefined,
        },
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
    });
  }, [editorTheme]);

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
    const model = getOrCreateModel({
      uri: VARIABLE_URI,
      value: initialVariables,
    });
    const editor = createEditor(ref, {
      model,
      readOnly,
    });
    setEditor({ variableEditor: editor });
    const { storage } = storageStore.getState();
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

    // 3️⃣ Clean‑up on unmount or when deps change
    return () => {
      for (const disposable of disposables) {
        disposable.dispose(); // remove the listener
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
}

export const STORAGE_KEY = 'variables';
