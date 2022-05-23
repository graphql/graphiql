import { getSelectedOperationName } from '@graphiql/toolkit';
import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';
import type {
  FragmentDefinitionNode,
  GraphQLSchema,
  ValidationRule,
} from 'graphql';
import { getOperationFacts } from 'graphql-language-service';
import { MutableRefObject, useContext, useEffect, useRef } from 'react';

import { markdown } from '../markdown';
import { useSchemaWithError } from '../schema';
import { StorageContext } from '../storage';
import debounce from '../utility/debounce';
import { commonKeys, importCodeMirror } from './common';
import { CodeMirrorEditorWithOperationFacts, EditorContext } from './context';
import {
  CompletionCallback,
  EditCallback,
  EmptyCallback,
  useCompletion,
  useKeyMap,
  useResizeEditor,
  useSynchronizeValue,
} from './hooks';
import { CodeMirrorEditor, CodeMirrorType } from './types';
import { normalizeWhitespace } from './whitespace';

type OnClickReference = (reference: SchemaReference) => void;

export type UseQueryEditorArgs = {
  defaultValue?: string;
  editorTheme?: string;
  externalFragments?: string | FragmentDefinitionNode[];
  onClickReference?: OnClickReference;
  onCopyQuery?: EmptyCallback;
  onEdit?: EditCallback;
  onEditOperationName?: EditCallback;
  onHintInformationRender?: CompletionCallback;
  onPrettifyQuery?: EmptyCallback;
  onMergeQuery?: EmptyCallback;
  onRunQuery?: EmptyCallback;
  readOnly?: boolean;
  validationRules?: ValidationRule[];
  value?: string;
};

export function useQueryEditor({
  defaultValue = DEFAULT_VALUE,
  editorTheme = 'graphiql',
  externalFragments,
  onClickReference,
  onCopyQuery,
  onEdit,
  onEditOperationName,
  onHintInformationRender,
  onMergeQuery,
  onPrettifyQuery,
  onRunQuery,
  readOnly = false,
  validationRules,
  value,
}: UseQueryEditorArgs = {}) {
  const { schema } = useSchemaWithError('hook', 'useQueryEditor');
  const editorContext = useContext(EditorContext);
  const storage = useContext(StorageContext);
  const ref = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<CodeMirrorType>();

  if (!editorContext) {
    throw new Error(
      'Tried to call the `useQueryEditor` hook without the necessary context. Make sure that the `EditorContextProvider` from `@graphiql/react` is rendered higher in the tree.',
    );
  }

  const { queryEditor, setQueryEditor, variableEditor } = editorContext;

  const onClickReferenceRef = useRef<OnClickReference>();
  useEffect(() => {
    onClickReferenceRef.current = onClickReference;
  }, [onClickReference]);

  const initialValue = useRef(
    value ?? storage?.get(STORAGE_KEY_QUERY) ?? defaultValue,
  );

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
        value: initialValue.current || '',
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
            onClickReferenceRef.current?.(reference);
          },
        },
        jump: {
          schema: undefined,
          onClick: (reference: SchemaReference) => {
            onClickReferenceRef.current?.(reference);
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

    return () => {
      isActive = false;
    };
  }, [editorTheme, readOnly, setQueryEditor]);

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
      if (!operationFacts) {
        return;
      }

      // Update operation name should any query names change.
      const operationName = getSelectedOperationName(
        editorInstance.operations ?? undefined,
        editorInstance.operationName ?? undefined,
        operationFacts.operations,
      );

      // Store the operation facts on editor properties
      editorInstance.documentAST = operationFacts.documentAST;
      editorInstance.operationName = operationName ?? null;
      editorInstance.operations = operationFacts.operations;
      editorInstance.variableToType = operationFacts.variableToType ?? null;

      // Update variable types for the variable editor
      if (variableEditor) {
        variableEditor.state.lint.linterOptions.variableToType =
          operationFacts.variableToType;
        variableEditor.options.lint.variableToType =
          operationFacts.variableToType;
        variableEditor.options.hintOptions.variableToType =
          operationFacts.variableToType;
        codeMirrorRef.current?.signal(variableEditor, 'change', variableEditor);
      }

      return { ...operationFacts, operationName };
    }

    const handleChange = debounce(
      100,
      (editorInstance: CodeMirrorEditorWithOperationFacts, change: any) => {
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
        onEdit?.(query);
        if (
          onEditOperationName &&
          operationFacts?.operationName !== undefined &&
          editorInstance.operationName !== operationFacts.operationName
        ) {
          onEditOperationName(operationFacts.operationName);
        }
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

  useSynchronizeValue(queryEditor, value);

  useCompletion(queryEditor, onHintInformationRender);

  useKeyMap(queryEditor, ['Cmd-Enter', 'Ctrl-Enter'], onRunQuery);
  useKeyMap(queryEditor, ['Shift-Ctrl-C'], onCopyQuery);
  useKeyMap(
    queryEditor,
    [
      'Shift-Ctrl-P',
      // Shift-Ctrl-P is hard coded in Firefox for private browsing so adding an alternative to Pretiffy
      'Shift-Ctrl-F',
    ],
    onPrettifyQuery,
  );
  useKeyMap(queryEditor, ['Shift-Ctrl-M'], onMergeQuery);

  useResizeEditor(queryEditor, ref);

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

const DEFAULT_VALUE = `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#     Merge Query:  Shift-Ctrl-M (or press the merge button above)
#
#       Run Query:  Ctrl-Enter (or press the play button above)
#
#   Auto Complete:  Ctrl-Space (or just start typing)
#

`;

const STORAGE_KEY_QUERY = 'query';

const STORAGE_KEY_OPERATION_NAME = 'operationName';
