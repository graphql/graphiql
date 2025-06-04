import { getSelectedOperationName } from '@graphiql/toolkit';
import type { DocumentNode } from 'graphql';
import { getOperationFacts } from 'graphql-language-service';
import { FC, useEffect, useRef } from 'react';
import {
  schemaStore,
  useSchemaStore,
  useEditorStore,
  useStorage,
  editorStore,
  executionStore,
  pluginStore,
} from '../stores';
import {
  debounce,
  getOrCreateModel,
  createEditor,
  onEditorContainerKeyDown,
} from '../utility';
import { MonacoEditor, EditorProps, SchemaReference } from '../types';
import { KEY_BINDINGS, MONACO_GRAPHQL_API, QUERY_URI } from '../constants';
import {
  type editor as monacoEditor,
  languages,
  Range,
} from '../monaco-editor';
import * as monaco from '../monaco-editor';
import { clsx } from 'clsx';
import { getContextAtPosition } from 'graphql-language-service/esm/parser';
import { toGraphQLPosition } from 'monaco-graphql/esm/utils';

interface QueryEditorProps extends EditorProps {
  /**
   * Invoked when a reference to the GraphQL schema (type or field) is clicked
   * as part of the editor or one of its tooltips.
   * @param reference - The reference that has been clicked.
   */
  onClickReference?(reference: SchemaReference): void;

  /**
   * Invoked when the contents of the query editor change.
   * @param value The new contents of the editor.
   * @param documentAST - The editor contents parsed into a GraphQL document.
   */
  onEdit?(value: string, documentAST?: DocumentNode): void;
}

export const QueryEditor: FC<QueryEditorProps> = ({
  onClickReference,
  onEdit,
  readOnly = false,
  ...props
}) => {
  const { initialQuery, setOperationName } = useEditorStore();
  const storage = useStorage();
  const ref = useRef<HTMLDivElement>(null!);

  /*
  useEffect(() => {
    void importCodeMirrorImports().then(CodeMirror => {
      const container = ref.current;
      const newEditor = CodeMirror(container, {
        hintOptions: {
          closeOnUnfocus: false,
          completeSingle: false,
          autocompleteOptions: {
            // for the query editor, restrict to executable type definitions
            mode: GraphQLDocumentMode.EXECUTABLE,
          },
        },
        info: {
          renderDescription: (text: string) => markdown.render(text),
          onClick(reference: SchemaReference) {
            onClickReferenceRef(reference);
          },
        },
        jump: {
          onClick(reference: SchemaReference) {
            onClickReferenceRef(reference);
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
    });
  }, []);
    */

  function getAndUpdateOperationFacts(editorInstance: MonacoEditor) {
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

    return operationFacts ? { ...operationFacts, operationName } : null;
  }

  const runAtCursor: monacoEditor.IActionDescriptor['run'] = editor => {
    const { operations, operationName: $operationName } =
      editorStore.getState();
    if (!operations) {
      return;
    }
    const position = editor.getPosition()!;
    const cursorIndex = editor.getModel()!.getOffsetAt(position);

    // Loop through all operations to see if one contains the cursor.
    let operationName: string | undefined;
    for (const operation of operations) {
      if (
        operation.loc &&
        operation.loc.start <= cursorIndex &&
        operation.loc.end >= cursorIndex
      ) {
        operationName = operation.name?.value;
      }
    }

    if (operationName && operationName !== $operationName) {
      setOperationName(operationName);
    }
    const { run } = executionStore.getState();
    run();
  };

  const schema = useSchemaStore(store => store.schema);

  useEffect(() => {
    globalThis.__MONACO = monaco;

    const { setEditor, updateActiveTabValues } = editorStore.getState();
    const model = getOrCreateModel({ uri: QUERY_URI, value: initialQuery });
    // Build the editor
    const editor = createEditor(ref, { model, readOnly });
    setEditor({ queryEditor: editor });

    // We don't use the generic `useChangeHandler` hook here because we want to
    // have additional logic that updates the operation facts that we save in `editorStore`
    const handleChange = debounce(100, () => {
      const query = editor.getValue();
      storage.set(STORAGE_KEY_QUERY, query);

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
    // Call once to initially update the values
    getAndUpdateOperationFacts(editor);

    const disposables = [
      // 2️⃣ Subscribe to content changes
      model.onDidChangeContent(handleChange),
      editor.addAction({
        ...KEY_BINDINGS.runQuery,
        run: runAtCursor,
      }),
      editor.addAction(KEY_BINDINGS.copyQuery),
      editor.addAction(KEY_BINDINGS.prettify),
      editor.addAction(KEY_BINDINGS.mergeFragments),
      editor,
      model,
    ];

    // 3️⃣ Clean‑up on unmount
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

    const { referencePlugin, setVisiblePlugin } = pluginStore.getState();
    const { setSchemaReference } = schemaStore.getState();
    if (!referencePlugin) {
      return;
    }

    const disposables = [
      languages.registerDefinitionProvider('graphql', {
        provideDefinition(model, p, _token) {
          const graphQLPosition = toGraphQLPosition(p);
          const context = getContextAtPosition(
            model.getValue(),
            graphQLPosition,
            schema,
          );
          if (!context) {
            return null;
          }
          const { typeInfo, token } = context;
          const { kind, step } = token.state;

          if (
            (kind === 'Field' && step === 0 && typeInfo.fieldDef) ||
            (kind === 'AliasedField' && step === 2 && typeInfo.fieldDef) ||
            (kind === 'ObjectField' && step === 0 && typeInfo.fieldDef) ||
            (kind === 'Directive' && step === 1 && typeInfo.directiveDef) ||
            (kind === 'Variable' && typeInfo.type) ||
            (kind === 'Argument' && step === 0 && typeInfo.argDef) ||
            (kind === 'EnumValue' &&
              typeInfo.enumValue &&
              'description' in typeInfo.enumValue) ||
            (kind === 'NamedType' &&
              typeInfo.type &&
              'description' in typeInfo.type)
          ) {
            return {
              uri: model.uri,
              range: new Range(p.lineNumber, p.column, p.lineNumber, p.column),
            };
          }

          return null;
        },
      }),
      languages.registerReferenceProvider('graphql', {
        provideReferences(model, p, _context, _token) {
          const graphQLPosition = toGraphQLPosition(p);
          const context = getContextAtPosition(
            model.getValue(),
            graphQLPosition,
            schema,
          );
          if (!context) {
            return null;
          }
          const { typeInfo, token } = context;
          const { kind } = token.state;
          if (!kind) {
            return null;
          }

          setVisiblePlugin(referencePlugin);
          setSchemaReference({ kind, typeInfo });
          onClickReference?.({ kind, typeInfo });

          return [
            {
              uri: model.uri,
              range: new Range(p.lineNumber, p.column, p.lineNumber, p.column),
            },
          ];
        },
      }),
    ];
    return () => {
      for (const disposable of disposables) {
        disposable.dispose();
      }
    };
  }, [onClickReference, schema]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={onEditorContainerKeyDown}
      {...props}
      className={clsx('graphiql-editor', props.className)}
    />
  );
};

export const STORAGE_KEY_QUERY = 'query';

const STORAGE_KEY_OPERATION_NAME = 'operationName';
