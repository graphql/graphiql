/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Editor } from 'codemirror';
import {
  FragmentDefinitionNode,
  GraphQLSchema,
  GraphQLType,
  ValidationRule,
} from 'graphql';
import MD from 'markdown-it';
import { normalizeWhitespace } from '../utility/normalizeWhitespace';
import onHasCompletion from '../utility/onHasCompletion';
import commonKeys from '../utility/commonKeys';
import { SizerComponent } from '../utility/CodeMirrorSizer';
import { importCodeMirror } from '../utility/importCodeMirror';
import { CodeMirrorEditor } from '../types';

const md = new MD();
const AUTO_COMPLETE_AFTER_KEY = /^[a-zA-Z0-9_@(]$/;

type QueryEditorProps = {
  schema?: GraphQLSchema | null;
  validationRules?: ValidationRule[];
  value?: string;
  onEdit?: (value: string) => void;
  readOnly?: boolean;
  onHintInformationRender: (elem: HTMLDivElement) => void;
  onClickReference?: (reference: GraphQLType) => void;
  onCopyQuery?: () => void;
  onPrettifyQuery?: () => void;
  onMergeQuery?: () => void;
  onRunQuery?: () => void;
  editorTheme?: string;
  externalFragments?: string | FragmentDefinitionNode[];
};

/**
 * QueryEditor
 *
 * Maintains an instance of CodeMirror responsible for editing a GraphQL query.
 *
 * Props:
 *
 *   - schema: A GraphQLSchema instance enabling editor linting and hinting.
 *   - value: The text of the editor.
 *   - onEdit: A function called when the editor changes, given the edited text.
 *   - readOnly: Turns the editor to read-only mode.
 *
 */
export class QueryEditor extends React.Component<QueryEditorProps, {}>
  implements SizerComponent {
  cachedValue: string | undefined;
  editor: CodeMirrorEditor | null = null;
  ignoreChangeEvent: boolean = false;
  CodeMirror: any;
  _node: HTMLElement | null = null;

  constructor(props: QueryEditorProps) {
    super(props);

    // Keep a cached version of the value, this cache will be updated when the
    // editor is updated, which can later be used to protect the editor from
    // unnecessary updates during the update lifecycle.
    this.cachedValue = props.value || '';
  }

  componentDidMount() {
    this.initializeEditor()
      .then(editor => {
        if (editor) {
          editor.on('change', this._onEdit);
          editor.on('keyup', this._onKeyUp);
          // @ts-ignore @TODO additional args for hasCompletion event
          editor.on('hasCompletion', this._onHasCompletion);
          editor.on('beforeChange', this._onBeforeChange);
        }
      })
      .catch(console.error);
  }

  componentDidUpdate(prevProps: QueryEditorProps) {
    // Ensure the changes caused by this update are not interpreted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    this.ignoreChangeEvent = true;
    let signalChange = false;
    if (this.props.schema !== prevProps.schema && this.editor) {
      this.editor.options.lint.schema = this.props.schema;
      this.editor.options.hintOptions.schema = this.props.schema;
      this.editor.options.info.schema = this.props.schema;
      this.editor.options.jump.schema = this.props.schema;
      signalChange = true;
    }
    if (
      this.props.externalFragments !== prevProps.externalFragments &&
      this.editor
    ) {
      this.editor.options.lint.externalFragments = this.props.externalFragments;
      this.editor.options.hintOptions.externalFragments = this.props.externalFragments;
      signalChange = true;
    }
    if (signalChange) {
      this.CodeMirror.signal(this.editor, 'change', this.editor);
    }
    if (
      this.props.value !== prevProps.value &&
      this.props.value !== this.cachedValue &&
      this.editor
    ) {
      this.cachedValue = this.props.value;
      this.editor.setValue(this.props.value as string);
    }
    this.ignoreChangeEvent = false;
  }

  componentWillUnmount() {
    if (this.editor) {
      this.editor.off('change', this._onEdit);
      this.editor.off('keyup', this._onKeyUp);
      // @ts-ignore @TODO additional args for hasCompletion event
      this.editor.off('hasCompletion', this._onHasCompletion);
    }
  }

  render() {
    return (
      <section
        className="query-editor"
        aria-label="Query Editor"
        ref={node => {
          this._node = node;
        }}
      />
    );
  }

  addonModules = () => [
    import('codemirror/addon/comment/comment'),
    import('codemirror/addon/search/search'),
    import('codemirror-graphql/hint'),
    import('codemirror-graphql/lint'),
    import('codemirror-graphql/info'),
    import('codemirror-graphql/jump'),
    import('codemirror-graphql/mode'),
  ];

  async initializeEditor() {
    const CodeMirror = (this.CodeMirror = await importCodeMirror(
      this.addonModules(),
    ));
    const editor = (this.editor = CodeMirror(this._node!, {
      value: this.props.value ?? '',
      lineNumbers: true,
      tabSize: 2,
      foldGutter: {
        // @ts-expect-error

        minFoldSize: 4,
      },
      mode: 'graphql',
      theme: this.props.editorTheme || 'graphiql',
      keyMap: 'sublime',
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      readOnly: this.props.readOnly ? 'nocursor' : false,
      lint: {
        // @ts-expect-error

        schema: this.props.schema,
        validationRules: this.props.validationRules ?? null,
        // linting accepts string or FragmentDefinitionNode[]
        externalFragments: this.props?.externalFragments,
      },
      hintOptions: {
        // @ts-expect-error

        schema: this.props.schema,
        closeOnUnfocus: false,
        completeSingle: false,
        container: this._node,
        externalFragments: this.props?.externalFragments,
      },
      info: {
        schema: this.props.schema,
        renderDescription: (text: string) => md.render(text),
        onClick: (reference: GraphQLType) =>
          this.props.onClickReference && this.props.onClickReference(reference),
      },
      jump: {
        schema: this.props.schema,
        onClick: (
          reference: GraphQLType, // TODO: it looks like this arg is not actually a GraphQL type but something from GraphiQL codemirror
        ) =>
          this.props.onClickReference && this.props.onClickReference(reference),
      },
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Cmd-Space': () =>
          editor.showHint({ completeSingle: true, container: this._node }),
        'Ctrl-Space': () =>
          editor.showHint({ completeSingle: true, container: this._node }),
        'Alt-Space': () =>
          editor.showHint({ completeSingle: true, container: this._node }),
        'Shift-Space': () =>
          editor.showHint({ completeSingle: true, container: this._node }),
        'Shift-Alt-Space': () =>
          editor.showHint({ completeSingle: true, container: this._node }),

        'Cmd-Enter': () => {
          if (this.props.onRunQuery) {
            this.props.onRunQuery();
          }
        },
        'Ctrl-Enter': () => {
          if (this.props.onRunQuery) {
            this.props.onRunQuery();
          }
        },

        'Shift-Ctrl-C': () => {
          if (this.props.onCopyQuery) {
            this.props.onCopyQuery();
          }
        },

        'Shift-Ctrl-P': () => {
          if (this.props.onPrettifyQuery) {
            this.props.onPrettifyQuery();
          }
        },

        /* Shift-Ctrl-P is hard coded in Firefox for private browsing so adding an alternative to Pretiffy */

        'Shift-Ctrl-F': () => {
          if (this.props.onPrettifyQuery) {
            this.props.onPrettifyQuery();
          }
        },

        'Shift-Ctrl-M': () => {
          if (this.props.onMergeQuery) {
            this.props.onMergeQuery();
          }
        },
        ...commonKeys,
        'Cmd-S': () => {
          if (this.props.onRunQuery) {
            // empty
          }
        },

        'Ctrl-S': () => {
          if (this.props.onRunQuery) {
            // empty
          }
        },
      },
    })) as CodeMirrorEditor;
    return editor;
  }

  /**
   * Public API for retrieving the CodeMirror instance from this
   * React component.
   */
  getCodeMirror() {
    return this.editor as Editor;
  }

  /**
   * Public API for retrieving the DOM client height for this component.
   */
  getClientHeight() {
    return this._node && this._node.clientHeight;
  }

  private _onKeyUp = (_cm: Editor, event: KeyboardEvent) => {
    if (AUTO_COMPLETE_AFTER_KEY.test(event.key) && this.editor) {
      this.editor.execCommand('autocomplete');
    }
  };

  private _onEdit = () => {
    if (!this.ignoreChangeEvent && this.editor) {
      this.cachedValue = this.editor.getValue();
      if (this.props.onEdit) {
        this.props.onEdit(this.cachedValue);
      }
    }
  };

  /**
   * Render a custom UI for CodeMirror's hint which includes additional info
   * about the type and description for the selected context.
   */
  private _onHasCompletion = (cm: Editor, data: any) => {
    onHasCompletion(cm, data, this.props.onHintInformationRender);
  };

  private _onBeforeChange(_instance: Editor, change: any) {
    // The update function is only present on non-redo, non-undo events.
    if (change.origin === 'paste') {
      const text = change.text.map(normalizeWhitespace);
      change.update(change.from, change.to, text);
    }
  }
}
