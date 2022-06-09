import { getSelectedOperationName } from '@graphiql/toolkit';
import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';
import type {
  DocumentNode,
  FragmentDefinitionNode,
  GraphQLSchema,
  ValidationRule,
} from 'graphql';
import { getOperationFacts } from 'graphql-language-service';
import { MutableRefObject, useEffect, useRef } from 'react';

import { useExecutionContext } from '../execution';
import { useExplorerContext } from '../explorer';
import { markdown } from '../markdown';
import { useSchemaContext } from '../schema';
import { useStorageContext } from '../storage';
import debounce from '../utility/debounce';
import { commonKeys, importCodeMirror } from './common';
import {
  CodeMirrorEditorWithOperationFacts,
  useEditorContext,
} from './context';
import {
  CopyQueryCallback,
  EditCallback,
  useCompletion,
  useCopyQuery,
  useKeyMap,
  useMergeQuery,
  usePrettifyEditors,
} from './hooks';
import { CodeMirrorEditor, CodeMirrorType } from './types';
import { normalizeWhitespace } from './whitespace';

type OnClickReference = (reference: SchemaReference) => void;

export type UseQueryEditorArgs = {
  editorTheme?: string;
  externalFragments?: string | FragmentDefinitionNode[];
  onClickReference?: OnClickReference;
  onCopyQuery?: CopyQueryCallback;
  onEdit?(value: string, documentAST?: DocumentNode): void;
  onEditOperationName?: EditCallback;
  readOnly?: boolean;
  validationRules?: ValidationRule[];
};

export function useQueryEditor({
  editorTheme = 'graphiql',
  externalFragments,
  onClickReference,
  onCopyQuery,
  onEdit,
  onEditOperationName,
  readOnly = false,
  validationRules,
}: UseQueryEditorArgs = {}) {
  const { schema } = useSchemaContext({
    nonNull: true,
    caller: useQueryEditor,
  });
  const {
    initialQuery,
    queryEditor,
    setQueryEditor,
    variableEditor,
    updateActiveTabValues,
  } = useEditorContext({
    nonNull: true,
    caller: useQueryEditor,
  });
  const executionContext = useExecutionContext();
  const storage = useStorageContext();
  const explorer = useExplorerContext();
  const copy = useCopyQuery({ caller: useQueryEditor, onCopyQuery });
  const merge = useMergeQuery({ caller: useQueryEditor });
  const prettify = usePrettifyEditors({ caller: useQueryEditor });
  const ref = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<CodeMirrorType>();

  const onClickReferenceRef = useRef<OnClickReference>(() => {});
  useEffect(() => {
    onClickReferenceRef.current = reference => {
      if (!explorer) {
        return;
      }
      explorer.show();
      if (reference && reference.kind === 'Type') {
        explorer.push({ name: reference.type.name, def: reference.type });
      } else if (reference.kind === 'Field') {
        explorer.push({ name: reference.field.name, def: reference.field });
      } else if (reference.kind === 'Argument' && reference.field) {
        explorer.push({ name: reference.field.name, def: reference.field });
      } else if (reference.kind === 'EnumValue' && reference.type) {
        explorer.push({ name: reference.type.name, def: reference.type });
      }
      onClickReference?.(reference);
    };
  }, [explorer, onClickReference]);

  useEffect(() => {
    let isActive = true;

    importCodeMirror([
      import('codemirror/addon/comment/comment'),
      import('codemirror/addon/search/search'),
      import('codemirror-graphql/esm/hint'),
      import('codemirror-graphql/esm/lint'),
      import('codemirror-graphql/esm/info'),
      import('codemirror-graphql/esm/jump'),
      import('codemirror-graphql/esm/mode'),
    ]).then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }

      codeMirrorRef.current = CodeMirror;

      const container = ref.current;
      if (!container) {
        return;
      }

      const newEditor = CodeMirror(container, {
        value: initialQuery,
        lineNumbers: true,
        tabSize: 2,
        foldGutter: true,
        mode: 'graphql',
        theme: editorTheme,
        keyMap: 'sublime',
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        readOnly: readOnly ? 'nocursor' : false,
        lint: {
          // @ts-expect-error
          schema: undefined,
          validationRules: null,
          // linting accepts string or FragmentDefinitionNode[]
          externalFragments: undefined,
        },
        hintOptions: {
          // @ts-expect-error
          schema: undefined,
          closeOnUnfocus: false,
          completeSingle: false,
          container,
          externalFragments: undefined,
        },
        info: {
          schema: undefined,
          renderDescription: (text: string) => markdown.render(text),
          onClick: (reference: SchemaReference) => {
            onClickReferenceRef.current(reference);
          },
        },
        jump: {
          schema: undefined,
          onClick: (reference: SchemaReference) => {
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

      newEditor.addKeyMap({
        'Cmd-Space'() {
          newEditor.showHint({ completeSingle: true, container });
        },
        'Ctrl-Space'() {
          newEditor.showHint({ completeSingle: true, container });
        },
        'Alt-Space'() {
          newEditor.showHint({ completeSingle: true, container });
        },
        'Shift-Space'() {
          newEditor.showHint({ completeSingle: true, container });
        },
        'Shift-Alt-Space'() {
          newEditor.showHint({ completeSingle: true, container });
        },
      });

      newEditor.on('keyup', (editorInstance, event) => {
        if (AUTO_COMPLETE_AFTER_KEY.test(event.key)) {
          editorInstance.execCommand('autocomplete');
        }
      });

      newEditor.on('beforeChange', (_editorInstance, change) => {
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

    return () => {
      isActive = false;
    };
  }, [editorTheme, initialQuery, readOnly, setQueryEditor]);

  /**
   * We don't use the generic `useChangeHandler` hook here because we want to
   * have additional logic that updates the operation facts that we store as
   * properties on the editor.
   */
  useEffect(() => {
    if (!queryEditor) {
      return;
    }

    function getAndUpdateOperationFacts(
      editorInstance: CodeMirrorEditorWithOperationFacts,
    ) {
      const operationFacts = getOperationFacts(
        schema,
        editorInstance.getValue(),
      );

      // Update operation name should any query names change.
      const operationName = getSelectedOperationName(
        editorInstance.operations ?? undefined,
        editorInstance.operationName ?? undefined,
        operationFacts?.operations,
      );

      // Store the operation facts on editor properties
      editorInstance.documentAST = operationFacts?.documentAST ?? null;
      editorInstance.operationName = operationName ?? null;
      editorInstance.operations = operationFacts?.operations ?? null;
      editorInstance.variableToType = operationFacts?.variableToType ?? null;

      // Update variable types for the variable editor
      if (variableEditor) {
        variableEditor.state.lint.linterOptions.variableToType =
          operationFacts?.variableToType;
        variableEditor.options.lint.variableToType =
          operationFacts?.variableToType;
        variableEditor.options.hintOptions.variableToType =
          operationFacts?.variableToType;
        codeMirrorRef.current?.signal(variableEditor, 'change', variableEditor);
      }

      return operationFacts ? { ...operationFacts, operationName } : null;
    }

    const handleChange = debounce(
      100,
      (editorInstance: CodeMirrorEditorWithOperationFacts) => {
        const query = editorInstance.getValue();
        storage?.set(STORAGE_KEY_QUERY, query);

        const operationFacts = getAndUpdateOperationFacts(editorInstance);
        if (operationFacts?.operationName !== undefined) {
          storage?.set(
            STORAGE_KEY_OPERATION_NAME,
            operationFacts.operationName,
          );
        }

        // Invoke callback props only after the operation facts have been updated
        onEdit?.(query, operationFacts?.documentAST);
        if (
          onEditOperationName &&
          operationFacts?.operationName !== undefined &&
          editorInstance.operationName !== operationFacts.operationName
        ) {
          onEditOperationName(operationFacts.operationName);
        }

        updateActiveTabValues({
          query,
          operationName: operationFacts?.operationName ?? null,
        });
      },
    ) as (editorInstance: CodeMirrorEditor) => void;

    // Call once to initially update the values
    getAndUpdateOperationFacts(queryEditor);

    queryEditor.on('change', handleChange);
    return () => queryEditor.off('change', handleChange);
  }, [
    onEdit,
    onEditOperationName,
    queryEditor,
    schema,
    storage,
    variableEditor,
    updateActiveTabValues,
  ]);

  useSynchronizeSchema(queryEditor, schema ?? null, codeMirrorRef);
  useSynchronizeValidationRules(
    queryEditor,
    validationRules ?? null,
    codeMirrorRef,
  );
  useSynchronizeExternalFragments(
    queryEditor,
    externalFragments,
    codeMirrorRef,
  );

  useCompletion(queryEditor);

  useKeyMap(queryEditor, ['Cmd-Enter', 'Ctrl-Enter'], executionContext?.run);
  useKeyMap(queryEditor, ['Shift-Ctrl-C'], copy);
  useKeyMap(
    queryEditor,
    [
      'Shift-Ctrl-P',
      // Shift-Ctrl-P is hard coded in Firefox for private browsing so adding an alternative to Pretiffy
      'Shift-Ctrl-F',
    ],
    prettify,
  );
  useKeyMap(queryEditor, ['Shift-Ctrl-M'], merge);

  return ref;
}

function useSynchronizeSchema(
  editor: CodeMirrorEditor | null,
  schema: GraphQLSchema | null,
  codeMirrorRef: MutableRefObject<CodeMirrorType | undefined>,
) {
  useEffect(() => {
    if (!editor) {
      return;
    }

    const didChange = editor.options.lint.schema !== schema;

    editor.state.lint.linterOptions.schema = schema;
    editor.options.lint.schema = schema;
    editor.options.hintOptions.schema = schema;
    editor.options.info.schema = schema;
    editor.options.jump.schema = schema;

    if (didChange && codeMirrorRef.current) {
      codeMirrorRef.current.signal(editor, 'change', editor);
    }
  }, [editor, schema, codeMirrorRef]);
}

function useSynchronizeValidationRules(
  editor: CodeMirrorEditor | null,
  validationRules: ValidationRule[] | null,
  codeMirrorRef: MutableRefObject<CodeMirrorType | undefined>,
) {
  useEffect(() => {
    if (!editor) {
      return;
    }

    const didChange = editor.options.lint.validationRules !== validationRules;

    editor.state.lint.linterOptions.validationRules = validationRules;
    editor.options.lint.validationRules = validationRules;

    if (didChange && codeMirrorRef.current) {
      codeMirrorRef.current.signal(editor, 'change', editor);
    }
  }, [editor, validationRules, codeMirrorRef]);
}

function useSynchronizeExternalFragments(
  editor: CodeMirrorEditor | null,
  externalFragments: string | FragmentDefinitionNode[] | undefined,
  codeMirrorRef: MutableRefObject<CodeMirrorType | undefined>,
) {
  useEffect(() => {
    if (!editor) {
      return;
    }

    const didChange =
      editor.options.lint.externalFragments !== externalFragments;

    editor.state.lint.linterOptions.externalFragments = externalFragments;
    editor.options.lint.externalFragments = externalFragments;
    editor.options.hintOptions.externalFragments = externalFragments;

    if (didChange && codeMirrorRef.current) {
      codeMirrorRef.current.signal(editor, 'change', editor);
    }
  }, [editor, externalFragments, codeMirrorRef]);
}

const AUTO_COMPLETE_AFTER_KEY = /^[a-zA-Z0-9_@(]$/;

export const STORAGE_KEY_QUERY = 'query';

const STORAGE_KEY_OPERATION_NAME = 'operationName';
