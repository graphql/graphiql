import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';
import type {
  FragmentDefinitionNode,
  GraphQLSchema,
  ValidationRule,
} from 'graphql';
import { MutableRefObject, useContext, useEffect, useRef } from 'react';

import { commonKeys, importCodeMirror } from './common';
import { EditorContext } from './context';
import {
  CompletionCallback,
  EditCallback,
  EmptyCallback,
  useChangeHandler,
  useCompletion,
  useKeyMap,
  useResizeEditor,
  useSynchronizeValue,
} from './hooks';
import { markdown } from '../markdown';
import { normalizeWhitespace } from './whitespace';
import { CodeMirrorType, CodeMirrorEditor } from './types';

type OnClickReference = (reference: SchemaReference) => void;

export type UseQueryEditorArgs = {
  editorTheme?: string;
  externalFragments?: string | FragmentDefinitionNode[];
  onClickReference?: OnClickReference;
  onCopyQuery?: EmptyCallback;
  onEdit?: EditCallback;
  onHintInformationRender?: CompletionCallback;
  onPrettifyQuery?: EmptyCallback;
  onMergeQuery?: EmptyCallback;
  onRunQuery?: EmptyCallback;
  readOnly?: boolean;
  schema?: GraphQLSchema | null;
  validationRules?: ValidationRule[];
  value?: string;
};

export function useQueryEditor({
  editorTheme = 'graphiql',
  externalFragments,
  onClickReference,
  onCopyQuery,
  onEdit,
  onHintInformationRender,
  onMergeQuery,
  onPrettifyQuery,
  onRunQuery,
  readOnly = false,
  schema,
  validationRules,
  value,
}: UseQueryEditorArgs = {}) {
  const context = useContext(EditorContext);
  const ref = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<CodeMirrorType>();

  if (!context) {
    throw new Error(
      'Tried to call the `useQueryEditor` hook without the necessary context. Make sure that the `EditorContextProvider` from `@graphiql/react` is rendered higher in the tree.',
    );
  }

  const { queryEditor, setQueryEditor } = context;

  const onClickReferenceRef = useRef<OnClickReference>();
  useEffect(() => {
    onClickReferenceRef.current = onClickReference;
  }, [onClickReference]);

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
      });

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

      setQueryEditor(newEditor);
    });

    return () => {
      isActive = false;
    };
  }, [editorTheme, readOnly, setQueryEditor]);

  useSynchronizeSchema(queryEditor, schema, codeMirrorRef);
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

  useChangeHandler(queryEditor, onEdit);

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
  schema: GraphQLSchema | null | undefined,
  codeMirrorRef: MutableRefObject<CodeMirrorType | undefined>,
) {
  useEffect(() => {
    if (!editor) {
      return;
    }

    const didChange = editor.options.lint.schema !== schema;

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

    editor.options.lint.externalFragments = externalFragments;
    editor.options.hintOptions.externalFragments = externalFragments;

    if (didChange && codeMirrorRef.current) {
      codeMirrorRef.current.signal(editor, 'change', editor);
    }
  }, [editor, externalFragments, codeMirrorRef]);
}

const AUTO_COMPLETE_AFTER_KEY = /^[a-zA-Z0-9_@(]$/;
