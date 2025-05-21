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
import {
  markdown,
  debounce,
  isMacOs,
  getOrCreateModel,
  createEditor,
} from '../utility';
import { Editor, WriteableEditorProps, SchemaReference } from './types';
import { normalizeWhitespace } from '../utility/whitespace';
import { KEY_BINDINGS, MONACO_GRAPHQL_API, QUERY_URI } from '../constants';
import {
  KeyCode,
  KeyMod,
  editor as monacoEditor,
  IDisposable,
  Uri,
  languages,
  Range,
} from '../monaco-editor';
import { clsx } from 'clsx';

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
  onClickReference,
  onEdit,
  readOnly = false,
  ...props
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
          externalFragments: undefined,
          autocompleteOptions: {
            // for the query editor, restrict to executable type definitions
            mode: GraphQLDocumentMode.EXECUTABLE,
          },
        },
        info: {
          renderDescription: (text: string) => markdown.render(text),
          onClick(reference: SchemaReference) {
            onClickReferenceRef.current(reference);
          },
        },
        jump: {
          onClick(reference: SchemaReference) {
            onClickReferenceRef.current(reference);
          },
        },
        gutters: ['CodeMirror-linenumbers'],
        extraKeys: {
          'Cmd-S'() {
            // empty
          },
          'Ctrl-S'() {
            // empty
          },
        },
      });

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
    });
  }, []);

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
    storage,
    variableEditor,
  ]);

  useSynchronizeSchema(queryEditor, codeMirrorRef);
  useSynchronizeValidationRules(queryEditor, codeMirrorRef);
  useSynchronizeExternalFragments(queryEditor, codeMirrorRef);

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
    const model = getOrCreateModel({ uri: QUERY_URI, value: initialQuery });
    // Build the editor
    const editor = createEditor(ref, { model, readOnly });
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

    const handleMouseDown = (e: monacoEditor.IEditorMouseEvent) => {
      const { position } = e.target;
      if (!position) {
        return;
      }
      console.log('on mouse down');
      const word = model.getWordAtPosition(position);
      if (word) {
        // eslint-disable-next-line no-console
        console.info(word);
        // eslint-disable-next-line no-console
        console.info(`Clicked on word "${word.word}"`);
      }
    };

    let linkProvider: IDisposable;
    let previousRange:
      | readonly [
          startLineNumber: number,
          startColumn: number,
          endLineNumber: number,
          endColumn: number,
        ]
      | null = null;

    const handleMove = debounce(5, (e: monacoEditor.IEditorMouseEvent) => {
      const { position } = e.target;
      if (!position) {
        return;
      }
      const word = model.getWordAtPosition(position);
      const isCmdPressed = isMacOs ? e.event.metaKey : e.event.ctrlKey;

      if (!word || !isCmdPressed) {
        previousRange = null;
        linkProvider?.dispose();
        return;
      }

      const currentRange = [
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn,
      ] as const;

      // Check if it's the same word
      const sameAsLast =
        previousRange &&
        currentRange[0] === previousRange[0] &&
        currentRange[1] === previousRange[1] &&
        currentRange[2] === previousRange[2] &&
        currentRange[3] === previousRange[3];
      // eslint-disable-next-line
      console.log('Same as the last word', sameAsLast);
      if (sameAsLast) {
        // Skip re-registering
        return;
      }

      // Update last word
      previousRange = currentRange;

      // Dispose previous provider and register a new one
      linkProvider?.dispose();
      linkProvider = languages.registerLinkProvider('graphql', {
        provideLinks(model, token) {
          return {
            links: [
              {
                range: new Range(...currentRange),
                tooltip: 'Go to node definition',
                url: Uri.parse('command:goToCustomNode?nodeId=abc123'),
              },
            ],
          };
        },
      });
    });

    const disposables = [
      // 2️⃣ Subscribe to content changes
      model.onDidChangeContent(handleChange),
      editor.addAction({
        id: 'graphql-go-to-definition',
        label: 'Go to Definition',
        contextMenuGroupId: 'navigation',
        // eslint-disable-next-line no-bitwise
        keybindings: [KeyMod.CtrlCmd | KeyCode.F12],
        run() {
          // eslint-disable-next-line no-console
          console.log('Go to Definition');
        },
      }),
      editor.addAction(KEY_BINDINGS.runQuery),
      editor.addAction(KEY_BINDINGS.copyQuery),
      editor.addAction(KEY_BINDINGS.prettify),
      editor.addAction(KEY_BINDINGS.mergeFragments),
      // editor.onMouseDown(handleMouseDown),
      // editor.onMouseMove(handleMove),
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

  return (
    <div
      ref={ref}
      {...props}
      className={clsx('graphiql-editor', props.className)}
    />
  );
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
