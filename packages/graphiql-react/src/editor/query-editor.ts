import { getSelectedOperationName } from '@graphiql/toolkit';
import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';
import type {
  DocumentNode,
  FragmentDefinitionNode,
  GraphQLSchema,
  ValidationRule,
} from 'graphql';
import { getOperationFacts } from 'graphql-language-service';
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { useExecutionContext } from '../execution';
import { useExplorerContext } from '../explorer';
import { markdown } from '../markdown';
import { DOC_EXPLORER_PLUGIN, usePluginContext } from '../plugin';
import { useSchemaContext } from '../schema';
import { useStorageContext } from '../storage';
import debounce from '../utility/debounce';
import {
  commonKeys,
  DEFAULT_EDITOR_THEME,
  DEFAULT_KEY_MAP,
  importCodeMirror,
} from './common';
import {
  CodeMirrorEditorWithOperationFacts,
  useEditorContext,
} from './context';
import {
  useCompletion,
  useCopyQuery,
  UseCopyQueryArgs,
  useKeyMap,
  useMergeQuery,
  usePrettifyEditors,
  useSynchronizeOption,
} from './hooks';
import {
  CodeMirrorEditor,
  CodeMirrorType,
  WriteableEditorProps,
} from './types';
import { normalizeWhitespace } from './whitespace';

export type UseQueryEditorArgs = WriteableEditorProps &
  Pick<UseCopyQueryArgs, 'onCopyQuery'> & {
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

export function useQueryEditor(
  {
    editorTheme = DEFAULT_EDITOR_THEME,
    keyMap = DEFAULT_KEY_MAP,
    onClickReference,
    onCopyQuery,
    onEdit,
    readOnly = false,
  }: UseQueryEditorArgs = {},
  caller?: Function,
) {
  const { schema } = useSchemaContext({
    nonNull: true,
    caller: caller || useQueryEditor,
  });
  const {
    externalFragments,
    initialQuery,
    queryEditor,
    setOperationName,
    setQueryEditor,
    validationRules,
    variableEditor,
    updateActiveTabValues,
  } = useEditorContext({
    nonNull: true,
    caller: caller || useQueryEditor,
  });
  const executionContext = useExecutionContext();
  const storage = useStorageContext();
  const explorer = useExplorerContext();
  const plugin = usePluginContext();
  const copy = useCopyQuery({ caller: caller || useQueryEditor, onCopyQuery });
  const merge = useMergeQuery({ caller: caller || useQueryEditor });
  const prettify = usePrettifyEditors({ caller: caller || useQueryEditor });
  const ref = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<CodeMirrorType>();

  const onClickReferenceRef = useRef<
    NonNullable<UseQueryEditorArgs['onClickReference']>
  >(() => {});
  useEffect(() => {
    onClickReferenceRef.current = reference => {
      if (!explorer || !plugin) {
        return;
      }
      plugin.setVisiblePlugin(DOC_EXPLORER_PLUGIN);
      switch (reference.kind) {
        case 'Type': {
          explorer.push({ name: reference.type.name, def: reference.type });
          break;
        }
        case 'Field': {
          explorer.push({ name: reference.field.name, def: reference.field });
          break;
        }
        case 'Argument': {
          if (reference.field) {
            explorer.push({ name: reference.field.name, def: reference.field });
          }
          break;
        }
        case 'EnumValue': {
          if (reference.type) {
            explorer.push({ name: reference.type.name, def: reference.type });
          }
          break;
        }
      }
      onClickReference?.(reference);
    };
  }, [explorer, onClickReference, plugin]);

  useEffect(() => {
    let isActive = true;

    void importCodeMirror([
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

      let showingHints = false;

      // fired whenever a hint dialog opens
      newEditor.on('startCompletion', () => {
        showingHints = true;
      });

      // the codemirror hint extension fires this anytime the dialog is closed
      // via any method (e.g. focus blur, escape key, ...)
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

    return () => {
      isActive = false;
    };
  }, [editorTheme, initialQuery, readOnly, setQueryEditor]);

  useSynchronizeOption(queryEditor, 'keyMap', keyMap);

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

        const currentOperationName = editorInstance.operationName;
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
          operationFacts?.operationName &&
          currentOperationName !== operationFacts.operationName
        ) {
          setOperationName(operationFacts.operationName);
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
    queryEditor,
    schema,
    setOperationName,
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

  useCompletion(queryEditor, onClickReference || null, useQueryEditor);

  const run = executionContext?.run;
  const runAtCursor = useCallback(() => {
    if (
      !run ||
      !queryEditor ||
      !queryEditor.operations ||
      !queryEditor.hasFocus()
    ) {
      run?.();
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

    run();
  }, [queryEditor, run, setOperationName]);

  useKeyMap(queryEditor, ['Cmd-Enter', 'Ctrl-Enter'], runAtCursor);
  useKeyMap(queryEditor, ['Shift-Ctrl-C'], copy);
  useKeyMap(
    queryEditor,
    [
      'Shift-Ctrl-P',
      // Shift-Ctrl-P is hard coded in Firefox for private browsing so adding an alternative to prettify
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
  externalFragments: Map<string, FragmentDefinitionNode>,
  codeMirrorRef: MutableRefObject<CodeMirrorType | undefined>,
) {
  const externalFragmentList = useMemo(
    () => [...externalFragments.values()],
    [externalFragments],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    const didChange =
      editor.options.lint.externalFragments !== externalFragmentList;

    editor.state.lint.linterOptions.externalFragments = externalFragmentList;
    editor.options.lint.externalFragments = externalFragmentList;
    editor.options.hintOptions.externalFragments = externalFragmentList;

    if (didChange && codeMirrorRef.current) {
      codeMirrorRef.current.signal(editor, 'change', editor);
    }
  }, [editor, externalFragmentList, codeMirrorRef]);
}

const AUTO_COMPLETE_AFTER_KEY = /^[a-zA-Z0-9_@(]$/;

export const STORAGE_KEY_QUERY = 'query';

const STORAGE_KEY_OPERATION_NAME = 'operationName';
