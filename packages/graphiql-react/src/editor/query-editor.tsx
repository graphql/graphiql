import { getSelectedOperationName } from '@graphiql/toolkit';
import type {
  DocumentNode,
  FragmentDefinitionNode,
  GraphQLSchema,
  ValidationRule,
} from 'graphql';
import {
  getOperationFacts,
  GraphQLDocumentMode,
  OperationFacts,
} from 'graphql-language-service';
import { useEffect, useRef } from 'react';
import {
  schemaStore,
  useSchemaStore,
  useEditorStore,
  useStorage,
  editorStore,
} from '../stores';
import { markdown, debounce } from '../utility';
import { commonKeys, DEFAULT_EDITOR_THEME } from './common';
import {
  useCompletion,
  copyQuery,
  mergeQuery,
  prettifyEditors,
  useSynchronizeOption,
} from './hooks';
import { Editor, WriteableEditorProps, SchemaReference } from './types';
import { normalizeWhitespace } from '../utility/whitespace';
import { KEY_BINDINGS, MODELS, MONACO_GRAPHQL_API } from '../constants';
import { createEditor } from '../create-editor';

type QueryEditorProps = WriteableEditorProps & {
  /**
   * Invoked when a reference to the GraphQL schema (type or field) is clicked
   * as part of the editor or one of its tooltips.
   * @param reference The reference that has been clicked.
   */
  onClickReference?(reference: SchemaReference): void;
  /**
   * Invoked when the contents of the query editor change.
   * @param value The new contents of the editor.
   * @param documentAST The editor contents parsed into a GraphQL document.
   */
  onEdit?(value: string, documentAST?: DocumentNode): void;
};

/*
// To make react-compiler happy since we mutate variableEditor
function updateVariableEditor(
  variableEditor: CodeMirrorEditor,
  operationFacts?: OperationFacts,
) {
  variableEditor.state.lint.linterOptions.variableToType =
    operationFacts?.variableToType;
  variableEditor.options.lint.variableToType = operationFacts?.variableToType;
  variableEditor.options.hintOptions.variableToType =
    operationFacts?.variableToType;
}

function updateEditorSchema(
  editor: CodeMirrorEditor,
  schema: GraphQLSchema | null,
) {
  editor.state.lint.linterOptions.schema = schema;
  editor.options.lint.schema = schema;
  editor.options.hintOptions.schema = schema;
  editor.options.info.schema = schema;
  editor.options.jump.schema = schema;
}

function updateEditorValidationRules(
  editor: CodeMirrorEditor,
  validationRules: ValidationRule[] | null,
) {
  editor.state.lint.linterOptions.validationRules = validationRules;
  editor.options.lint.validationRules = validationRules;
}

function updateEditorExternalFragments(
  editor: CodeMirrorEditor,
  externalFragmentList: FragmentDefinitionNode[],
) {
  editor.state.lint.linterOptions.externalFragments = externalFragmentList;
  editor.options.lint.externalFragments = externalFragmentList;
  editor.options.hintOptions.externalFragments = externalFragmentList;
}
*/
export function QueryEditor({
  editorTheme = DEFAULT_EDITOR_THEME,
  onClickReference,
  onEdit,
  readOnly = false,
}: QueryEditorProps) {
  const { initialQuery, queryEditor, setOperationName, variableEditor } =
    useEditorStore();
  const storage = useStorage();
  const ref = useRef<HTMLDivElement>(null!);

  /*
  const onClickReferenceRef = useRef<
    NonNullable<QueryEditorProps['onClickReference']>
  >(() => {});

  useEffect(() => {
    const { referencePlugin, setVisiblePlugin } = pluginStore.getState();
    const { setSchemaReference } = schemaStore.getState();
    onClickReferenceRef.current = reference => {
      if (!referencePlugin) {
        return;
      }
      setVisiblePlugin(referencePlugin);
      setSchemaReference(reference);
      onClickReference?.(reference);
    };
  }, [onClickReference]);

  useEffect(() => {
    void importCodeMirrorImports().then(CodeMirror => {
      codeMirrorRef.current = CodeMirror;

      const container = ref.current;
      const newEditor = CodeMirror(container, {
        value: initialQuery,
        foldGutter: true,
        theme: editorTheme,
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        lint: {
          schema: undefined,
          validationRules: null,
          // linting accepts string or FragmentDefinitionNode[]
          externalFragments: undefined,
        },
        hintOptions: {
          schema: undefined,
          closeOnUnfocus: false,
          completeSingle: false,
          container,
          externalFragments: undefined,
          autocompleteOptions: {
            // for the query editor, restrict to executable type definitions
            mode: GraphQLDocumentMode.EXECUTABLE,
          },
        },
        info: {
          schema: undefined,
          renderDescription: (text: string) => markdown.render(text),
          onClick(reference: SchemaReference) {
            onClickReferenceRef.current(reference);
          },
        },
        jump: {
          schema: undefined,
          onClick(reference: SchemaReference) {
            onClickReferenceRef.current(reference);
          },
        },
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        extraKeys: {
          ...commonKeys,
          'Cmd-S'() {
            // empty
          },
          'Ctrl-S'() {
            // empty
          },
        },
      }) as CodeMirrorEditorWithOperationFacts;

      function showHint() {
        newEditor.showHint({ completeSingle: true, container });
      }

      newEditor.addKeyMap({
        'Cmd-Space': showHint,
        'Ctrl-Space': showHint,
        'Alt-Space': showHint,
        'Shift-Space': showHint,
        'Shift-Alt-Space': showHint,
      });

      newEditor.on('keyup', (editorInstance, event) => {
        if (AUTO_COMPLETE_AFTER_KEY.test(event.key)) {
          editorInstance.execCommand('autocomplete');
        }
      });

      let showingHints = false;

      // fired whenever a hint dialog opens
      newEditor.on('startCompletion', () => {
        showingHints = true;
      });

      // the codemirror hint extension fires this anytime the dialog is closed
      // via any method (e.g., focus blur, escape key, ...)
      newEditor.on('endCompletion', () => {
        showingHints = false;
      });

      newEditor.on('keydown', (editorInstance, event) => {
        if (event.key === 'Escape' && showingHints) {
          event.stopPropagation();
        }
      });

      newEditor.on('beforeChange', (editorInstance, change) => {
        // The update function is only present on non-redo, non-undo events.
        if (change.origin === 'paste') {
          const text = change.text.map(normalizeWhitespace);
          change.update?.(change.from, change.to, text);
        }
      });

      newEditor.documentAST = null;
      newEditor.operationName = null;
      newEditor.operations = null;
      newEditor.variableToType = null;

      setQueryEditor(newEditor);
    });
  }, [editorTheme, initialQuery]);

  // We don't use the generic `useChangeHandler` hook here because we want to
  // have additional logic that updates the operation facts that we store as
  // properties on the editor.
  useEffect(() => {
    if (!queryEditor) {
      return;
    }
    */

  function getAndUpdateOperationFacts(editorInstance: Editor) {
    const operationFacts = getOperationFacts(
      schemaStore.getState().schema,
      editorInstance.getValue(),
    );
    const prevState = editorStore.getState();

    // Update the operation name should any query names change.
    const operationName = getSelectedOperationName(
      prevState.operations,
      prevState.operationName,
      operationFacts?.operations,
    );

    // Store the operation facts
    editorStore.setState({
      documentAST: operationFacts?.documentAST,
      operationName,
      operations: operationFacts?.operations,
    });

    // Update variable types for the variable editor
    if (variableEditor) {
      // updateVariableEditor(variableEditor, operationFacts);
      // codeMirrorRef.current?.signal(variableEditor, 'change', variableEditor);
    }

    return operationFacts ? { ...operationFacts, operationName } : null;
  }

  /*
    // Call once to initially update the values
    getAndUpdateOperationFacts(queryEditor);
  }, [
    onEdit,
    queryEditor,
    setOperationName,
    storage,
    variableEditor,
    updateActiveTabValues,
  ]);

  useSynchronizeSchema(queryEditor, codeMirrorRef);
  useSynchronizeValidationRules(queryEditor, codeMirrorRef);
  useSynchronizeExternalFragments(queryEditor, codeMirrorRef);

  useCompletion(queryEditor, onClickReference);

  const runAtCursor = () => {
    if (!queryEditor?.operations || !queryEditor.hasFocus()) {
      return;
    }

    const cursorIndex = queryEditor.indexFromPos(queryEditor.getCursor());

    // Loop through all operations to see if one contains the cursor.
    let operationName: string | undefined;
    for (const operation of queryEditor.operations) {
      if (
        operation.loc &&
        operation.loc.start <= cursorIndex &&
        operation.loc.end >= cursorIndex
      ) {
        operationName = operation.name?.value;
      }
    }

    if (operationName && operationName !== queryEditor.operationName) {
      setOperationName(operationName);
    }
    const { run } = executionStore.getState();
    run();
  };
  useKeyMap(queryEditor, KEY_MAP.runQuery, runAtCursor);
  */

  const schema = useSchemaStore(store => store.schema);

  useEffect(() => {
    const { setEditor, updateActiveTabValues } = editorStore.getState();
    // Build the editor
    const editor = createEditor(ref, {
      model: MODELS.query,
      readOnly
    });

    setEditor({ queryEditor: editor });
    const handleChange = debounce(100, () => {
      const query = editor.getValue();
      storage.set(STORAGE_KEY_QUERY, query);
      // eslint-disable-next-line no-console
      console.log('handleChange', query);

      const currentOperationName = editorStore.getState().operationName;
      const operationFacts = getAndUpdateOperationFacts(editor);
      if (operationFacts?.operationName !== undefined) {
        storage.set(STORAGE_KEY_OPERATION_NAME, operationFacts.operationName);
      }

      // Invoke callback props only after the operation facts have been updated
      onEdit?.(query, operationFacts?.documentAST);
      if (
        operationFacts?.operationName &&
        currentOperationName !== operationFacts.operationName
      ) {
        setOperationName(operationFacts.operationName);
      }

      updateActiveTabValues({
        query,
        operationName: operationFacts?.operationName ?? null,
      });
    });

    const model = editor.getModel()!;

    const disposables = [
      // 2️⃣ Subscribe to content changes
      model.onDidChangeContent(handleChange),
      editor.addAction(KEY_BINDINGS.runQuery),
      editor.addAction(KEY_BINDINGS.copyQuery),
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

  useEffect(() => {
    if (!schema) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log('setting setSchemaConfig');
    MONACO_GRAPHQL_API.setSchemaConfig([{ uri: 'schema.graphql', schema }]);
  }, [schema]);

  return <div className="graphiql-editor" ref={ref} />;
}

/*
function useSynchronizeSchema(
  editor: CodeMirrorEditor | null,
  codeMirrorRef: RefObject<CodeMirrorType | undefined>,
) {
  const schema = useSchemaStore(store => store.schema ?? null);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const didChange = editor.options.lint.schema !== schema;
    updateEditorSchema(editor, schema);

    if (didChange) {
      codeMirrorRef.current?.signal(editor, 'change', editor);
    }
  }, [editor, schema, codeMirrorRef]);
}

function useSynchronizeValidationRules(
  editor: CodeMirrorEditor | null,
  codeMirrorRef: RefObject<CodeMirrorType | undefined>,
) {
  const validationRules = useEditorStore(store => store.validationRules);
  useEffect(() => {
    if (!editor) {
      return;
    }

    const didChange = editor.options.lint.validationRules !== validationRules;
    updateEditorValidationRules(editor, validationRules);

    if (didChange) {
      codeMirrorRef.current?.signal(editor, 'change', editor);
    }
  }, [editor, validationRules, codeMirrorRef]);
}

function useSynchronizeExternalFragments(
  editor: CodeMirrorEditor | null,
  codeMirrorRef: RefObject<CodeMirrorType | undefined>,
) {
  const externalFragments = useEditorStore(store => store.externalFragments);
  useEffect(() => {
    if (!editor) {
      return;
    }
    const externalFragmentList = [...externalFragments.values()];
    const didChange =
      editor.options.lint.externalFragments !== externalFragmentList;
    updateEditorExternalFragments(editor, externalFragmentList);

    if (didChange) {
      codeMirrorRef.current?.signal(editor, 'change', editor);
    }
  }, [editor, externalFragments, codeMirrorRef]);
}
*/
const AUTO_COMPLETE_AFTER_KEY = /^[a-zA-Z0-9_@(]$/;

export const STORAGE_KEY_QUERY = 'query';

const STORAGE_KEY_OPERATION_NAME = 'operationName';
