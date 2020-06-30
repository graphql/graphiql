/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import type * as CM from 'codemirror';
import { GraphQLSchema, GraphQLType } from 'graphql';
import MD from 'markdown-it';
import { normalizeWhitespace } from '../utility/normalizeWhitespace';
import onHasCompletion from '../utility/onHasCompletion';
import commonKeys from '../utility/commonKeys';
import { SizerComponent } from '../utility/CodeMirrorSizer';

const md = new MD();
const AUTO_COMPLETE_AFTER_KEY = /^[a-zA-Z0-9_@(]$/;

type QueryEditorProps = {
  schema?: GraphQLSchema;
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
  editor: (CM.Editor & { options: any }) | null = null;
  ignoreChangeEvent: boolean = false;

  _node: HTMLElement | null = null;

  constructor(props: QueryEditorProps) {
    super(props);

    // Keep a cached version of the value, this cache will be updated when the
    // editor is updated, which can later be used to protect the editor from
    // unnecessary updates during the update lifecycle.
    this.cachedValue = props.value || '';
  }

  async componentDidMount() {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const { default: CodeMirror } = await import('codemirror');
    await this.loadCodeMirrorModules();

    const editor: CM.Editor = (this.editor = CodeMirror(
      // @ts-ignore
      this._node as HTMLElement,
      {
        value: this.props.value || '',
        lineNumbers: true,
        tabSize: 2,
        mode: 'graphql',
        theme: this.props.editorTheme || 'graphiql',
        keyMap: 'sublime',
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        readOnly: this.props.readOnly ? 'nocursor' : false,
        foldGutter: {
          minFoldSize: 4,
        },
        lint: {
          schema: this.props.schema,
        },
        hintOptions: {
          schema: this.props.schema,
          closeOnUnfocus: false,
          completeSingle: false,
          container: this._node,
        },
        info: {
          schema: this.props.schema,
          renderDescription: (text: string) => md.render(text),
          onClick: (reference: GraphQLType) =>
            this.props.onClickReference &&
            this.props.onClickReference(reference),
        },
        jump: {
          schema: this.props.schema,
          onClick: (
            reference: GraphQLType, // TODO: it looks like this arg is not actually a GraphQL type but something from GraphiQL codemirror
          ) =>
            this.props.onClickReference &&
            this.props.onClickReference(reference),
        },
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        extraKeys: {
          'Cmd-Space': () =>
            // @ts-ignore showHint method needs improvement on definatelytyped
            editor.showHint({ completeSingle: true, container: this._node }),
          'Ctrl-Space': () =>
            // @ts-ignore showHint method needs improvement on definatelytyped

            editor.showHint({ completeSingle: true, container: this._node }),
          'Alt-Space': () =>
            // @ts-ignore showHint method needs improvement on definatelytyped
            editor.showHint({ completeSingle: true, container: this._node }),
          'Shift-Space': () =>
            // @ts-ignore showHint method needs improvement on definatelytyped
            editor.showHint({ completeSingle: true, container: this._node }),
          'Shift-Alt-Space': () =>
            // @ts-ignore showHint method needs improvement on definatelytyped
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
      },
    ) as CM.Editor & { options: any });
    if (editor) {
      editor.on('change', this._onEdit);
      editor.on('keyup', this._onKeyUp);
      // @ts-ignore @TODO additional args for hasCompletion event
      editor.on('hasCompletion', this._onHasCompletion);
      editor.on('beforeChange', this._onBeforeChange);
    }
  }

  async componentDidUpdate(prevProps: QueryEditorProps) {
    const { default: CodeMirror } = await import('codemirror');

    // Ensure the changes caused by this update are not interpretted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    this.ignoreChangeEvent = true;
    if (this.props.schema !== prevProps.schema && this.editor) {
      this.editor.options.lint.schema = this.props.schema;
      this.editor.options.hintOptions.schema = this.props.schema;
      this.editor.options.info.schema = this.props.schema;
      this.editor.options.jump.schema = this.props.schema;
      CodeMirror.signal(this.editor, 'change', this.editor);
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
      this.editor = null;
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

  async loadCodeMirrorModules() {
    return Promise.all([
      import('codemirror/addon/hint/show-hint'),
      import('codemirror/addon/comment/comment'),
      import('codemirror/addon/edit/matchbrackets'),
      import('codemirror/addon/edit/closebrackets'),
      // @ts-ignore
      import('codemirror/addon/fold/foldgutter'),
      // @ts-ignore
      import('codemirror/addon/fold/brace-fold'),
      // @ts-ignore
      import('codemirror/addon/search/search'),
      import('codemirror/addon/search/searchcursor'),
      // @ts-ignore
      import('codemirror/addon/search/jump-to-line'),
      // @ts-ignore
      import('codemirror/addon/dialog/dialog'),
      // @ts-ignore
      import('codemirror/addon/lint/lint'),
      // @ts-ignore
      import('codemirror/keymap/sublime'),
      // @ts-ignore
      import('codemirror-graphql/hint'),
      // @ts-ignore
      import('codemirror-graphql/lint'),
      // @ts-ignore
      import('codemirror-graphql/info'),
      // @ts-ignore
      import('codemirror-graphql/jump'),
      // @ts-ignore
      import('codemirror-graphql/mode'),
    ]);
  }

  /**
   * Public API for retrieving the CodeMirror instance from this
   * React component.
   */
  getCodeMirror() {
    return this.editor as CM.Editor;
  }

  /**
   * Public API for retrieving the DOM client height for this component.
   */
  getClientHeight() {
    return this._node && this._node.clientHeight;
  }

  private _onKeyUp = (_cm: CM.Editor, event: KeyboardEvent) => {
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
  private _onHasCompletion = (cm: CM.Editor, data: any) => {
    onHasCompletion(cm, data, this.props.onHintInformationRender);
  };

  private _onBeforeChange(_instance: CM.Editor, change: any) {
    // The update function is only present on non-redo, non-undo events.
    if (change.origin === 'paste') {
      const text = change.text.map(normalizeWhitespace);
      change.update(change.from, change.to, text);
    }
  }
}
