import { getSelectedOperationName } from '@graphiql/toolkit';
import type { DocumentNode } from 'graphql';
import { getOperationFacts } from 'graphql-language-service';
import { FC, useEffect, useRef } from 'react';
import { initializeMode } from 'monaco-graphql/esm/lite.js';
import { useStorage } from '../stores';
import { useGraphiQL, useGraphiQLActions } from './provider';
import {
  debounce,
  getOrCreateModel,
  createEditor,
  onEditorContainerKeyDown,
  pick,
  cleanupDisposables,
  cn,
} from '../utility';
import type { MonacoEditor, EditorProps, SchemaReference } from '../types';
import {
  KEY_BINDINGS,
  JSON_DIAGNOSTIC_OPTIONS,
  URI_NAME,
  STORAGE_KEY,
} from '../constants';
import {
  type editor as monacoEditor,
  languages,
  Range,
  Uri,
} from '../monaco-editor';
import * as monaco from '../monaco-editor';
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
   * @param value - The new contents of the editor.
   * @param documentAST - The editor contents parsed into a GraphQL document.
   */
  onEdit?(value: string, documentAST?: DocumentNode): void;
}

const validateVariablesJSON: Record<string, string[]> = Object.create(null);

export const OperationEditor: FC<QueryEditorProps> = ({
  onClickReference,
  onEdit,
  ...props
}) => {
  const {
    setOperationName,
    setEditor,
    updateActiveTabValues,
    setVisiblePlugin,
    setSchemaReference,
    run,
    setOperationFacts,
    copyQuery,
    prettifyEditors,
    mergeQuery,
  } = useGraphiQLActions();
  const {
    initialQuery,
    schema,
    referencePlugin,
    operations,
    operationName,
    externalFragments,
    uriInstanceId,
  } = useGraphiQL(
    pick(
      'initialQuery',
      'schema',
      'referencePlugin',
      'operations',
      'operationName',
      'externalFragments',
      'uriInstanceId',
    ),
  );
  const storage = useStorage();
  const ref = useRef<HTMLDivElement>(null!);
  const onClickReferenceRef = useRef<QueryEditorProps['onClickReference']>(
    null!,
  );
  const monacoGraphQLApiRef = useRef<ReturnType<typeof initializeMode>>(null!);
  useEffect(() => {
    onClickReferenceRef.current = onClickReference;
  }, [onClickReference]);

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
    const operationFacts = getOperationFacts(schema, editorInstance.getValue());
    // Update the operation name should any query names change.
    const newOperationName = getSelectedOperationName(
      operations,
      operationName,
      operationFacts?.operations,
    );
    setOperationFacts({
      documentAST: operationFacts?.documentAST,
      operationName: newOperationName,
      operations: operationFacts?.operations,
    });

    return operationFacts
      ? { ...operationFacts, operationName: newOperationName }
      : null;
  }

  const runAtCursorRef = useRef<monacoEditor.IActionDescriptor['run']>(null!);

  useEffect(() => {
    runAtCursorRef.current = editor => {
      if (!operations) {
        run();
        return;
      }
      const position = editor.getPosition()!;
      const cursorIndex = editor.getModel()!.getOffsetAt(position);

      // Loop through all operations to see if one contains the cursor.
      let newOperationName: string | undefined;
      for (const operation of operations) {
        if (
          operation.loc &&
          operation.loc.start <= cursorIndex &&
          operation.loc.end >= cursorIndex
        ) {
          newOperationName = operation.name?.value;
        }
      }

      if (newOperationName && newOperationName !== operationName) {
        setOperationName(newOperationName);
      }
      run();
    };
  }, [operationName, operations, run, setOperationName]);

  useEffect(() => {
    const operationUri = Uri.file(`${uriInstanceId}${URI_NAME.operation}`);
    const variablesUri = Uri.file(`${uriInstanceId}${URI_NAME.variables}`);
    /**
     * Mutate the global `validateVariablesJSON` object to setup which operation editor is validated
     * by which variables editor. Since we can have multiple GraphiQL instances on the same page.
     */
    validateVariablesJSON[operationUri.toString()] = [variablesUri.toString()];

    monacoGraphQLApiRef.current = initializeMode({
      diagnosticSettings: {
        validateVariablesJSON,
        jsonDiagnosticSettings: {
          validate: true,
          schemaValidation: 'error',
          // Set these again, because we are entirely re-setting them here
          ...JSON_DIAGNOSTIC_OPTIONS,
        },
      },
    });
    globalThis.__MONACO = monaco;
    const model = getOrCreateModel({
      uri: operationUri.path.replace('/', ''),
      value: initialQuery,
    });
    const editor = createEditor(ref, { model });
    setEditor({ queryEditor: editor });

    // We don't use the generic `useChangeHandler` hook here because we want to
    // have additional logic that updates the operation facts that we save in `editorStore`
    const handleChange = debounce(100, () => {
      const query = editor.getValue();
      storage.set(STORAGE_KEY.query, query);

      const operationFacts = getAndUpdateOperationFacts(editor);
      // Invoke callback props only after the operation facts have been updated
      onEdit?.(query, operationFacts?.documentAST);
      if (
        operationFacts?.operationName &&
        operationName !== operationFacts.operationName
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
      model.onDidChangeContent(handleChange),
      editor.addAction({
        ...KEY_BINDINGS.runQuery,
        run: (...args) => runAtCursorRef.current(...args),
      }),
      editor.addAction({ ...KEY_BINDINGS.copyQuery, run: copyQuery }),
      editor.addAction({ ...KEY_BINDINGS.prettify, run: prettifyEditors }),
      editor.addAction({ ...KEY_BINDINGS.mergeFragments, run: mergeQuery }),
      editor,
      model,
    ];
    return cleanupDisposables(disposables);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  useEffect(() => {
    if (!schema) {
      return;
    }
    const monacoGraphQLApi = monacoGraphQLApiRef.current;
    monacoGraphQLApi.setSchemaConfig([
      { uri: `${uriInstanceId}${URI_NAME.schema}`, schema },
    ]);
    monacoGraphQLApi.setExternalFragmentDefinitions([
      ...externalFragments.values(),
    ]);
    if (!referencePlugin) {
      return;
    }

    let currentSchemaReference: SchemaReference | null = null;

    const disposables = [
      languages.registerDefinitionProvider('graphql', {
        provideDefinition(model, position, _token) {
          const graphQLPosition = toGraphQLPosition(position);
          const context = getContextAtPosition(
            model.getValue(),
            graphQLPosition,
            schema,
          );
          if (!context) {
            return;
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
            currentSchemaReference = { kind, typeInfo };
            const { lineNumber, column } = position;
            const range = new Range(lineNumber, column, lineNumber, column);
            return [{ uri: model.uri, range }];
          }
          currentSchemaReference = null;
        },
      }),
      languages.registerReferenceProvider('graphql', {
        provideReferences(model, { lineNumber, column }, _context, _token) {
          if (!currentSchemaReference) {
            return;
          }
          setVisiblePlugin(referencePlugin);
          setSchemaReference(currentSchemaReference);
          onClickReferenceRef.current?.(currentSchemaReference);

          const range = new Range(lineNumber, column, lineNumber, column);
          return [{ uri: model.uri, range }];
        },
      }),
    ];
    return cleanupDisposables(disposables);
  }, [
    schema,
    referencePlugin,
    setSchemaReference,
    setVisiblePlugin,
    externalFragments,
    uriInstanceId,
  ]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={onEditorContainerKeyDown}
      {...props}
      className={cn('graphiql-editor', props.className)}
    />
  );
};
