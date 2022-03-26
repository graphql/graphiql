/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import type * as CM from 'codemirror';
import React from 'react';

import onHasCompletion from '../utility/onHasCompletion';
import commonKeys from '../utility/commonKeys';
import { importCodeMirror } from '../utility/importCodeMirror';

declare module CodeMirror {
  export interface Editor extends CM.Editor {}
  export interface ShowHintOptions {
    completeSingle: boolean;
    hint: any;
    container: HTMLElement | null;
  }
}

type HeaderEditorProps = {
  value?: string;
  onEdit: (value: string) => void;
  readOnly?: boolean;
  onHintInformationRender: (value: HTMLDivElement) => void;
  onPrettifyQuery: (value?: string) => void;
  onMergeQuery: (value?: string) => void;
  onRunQuery: (value?: string) => void;
  editorTheme?: string;
  active?: boolean;
};

/**
 * HeaderEditor
 *
 * An instance of CodeMirror for editing headers to be passed with the GraphQL request.
 *
 * Props:
 *
 *   - value: The text of the editor.
 *   - onEdit: A function called when the editor changes, given the edited text.
 *   - readOnly: Turns the editor to read-only mode.
 *
 */
export class HeaderEditor extends React.Component<HeaderEditorProps> {
  CodeMirror: any;
  editor: (CM.Editor & { options: any; showHint: any }) | null = null;
  cachedValue: string;
  private _node: HTMLElement | null = null;
  ignoreChangeEvent: boolean = false;

  constructor(props: HeaderEditorProps) {
    super(props);

    // Keep a cached version of the value, this cache will be updated when the
    // editor is updated, which can later be used to protect the editor from
    // unnecessary updates during the update lifecycle.
    this.cachedValue = props.value || '';
  }

  componentDidMount() {
    this.initializeEditor()
      .then(editor => {
        editor.on('change', this._onEdit);
        editor.on('keyup', this._onKeyUp);
        editor.on('hasCompletion', this._onHasCompletion);
      })
      .catch(console.error);
  }

  componentDidUpdate(prevProps: HeaderEditorProps) {
    if (!this.editor) {
      return;
    }

    // Ensure the changes caused by this update are not interpretted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    this.ignoreChangeEvent = true;
    if (
      this.props.value !== prevProps.value &&
      this.props.value !== this.cachedValue
    ) {
      const thisValue = this.props.value || '';
      this.cachedValue = thisValue;
      this.editor.setValue(thisValue);
    }
    this.ignoreChangeEvent = false;
  }

  componentWillUnmount() {
    if (!this.editor) {
      return;
    }
    this.editor.off('change', this._onEdit);
    this.editor.off('keyup', this._onKeyUp);
    // @ts-expect-error
    this.editor.off('hasCompletion', this._onHasCompletion);
    this.editor = null;
  }

  render() {
    return (
      <div
        className="codemirrorWrap"
        // This horrible hack is necessary because a simple display none toggle
        // causes one of the editors' gutters to break otherwise.
        style={{
          position: this.props.active ? 'relative' : 'absolute',
          visibility: this.props.active ? 'visible' : 'hidden',
        }}
        ref={node => {
          this._node = node as HTMLDivElement;
        }}
      />
    );
  }

  // @ts-expect-error
  addonModules = () => [import('codemirror/mode/javascript/javascript')];

  async initializeEditor() {
    this.CodeMirror = await importCodeMirror(this.addonModules());
    const editor = (this.editor = this.CodeMirror(this._node, {
      value: this.props.value || '',
      lineNumbers: true,
      tabSize: 2,
      mode: { name: 'javascript', json: true },
      theme: this.props.editorTheme || 'graphiql',
      keyMap: 'sublime',
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      readOnly: this.props.readOnly ? 'nocursor' : false,
      foldGutter: {
        minFoldSize: 4,
      },
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Cmd-Space': () =>
          this.editor!.showHint({
            completeSingle: false,
            container: this._node,
          } as CodeMirror.ShowHintOptions),
        'Ctrl-Space': () =>
          this.editor!.showHint({
            completeSingle: false,
            container: this._node,
          } as CodeMirror.ShowHintOptions),
        'Alt-Space': () =>
          this.editor!.showHint({
            completeSingle: false,
            container: this._node,
          } as CodeMirror.ShowHintOptions),
        'Shift-Space': () =>
          this.editor!.showHint({
            completeSingle: false,
            container: this._node,
          } as CodeMirror.ShowHintOptions),
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
        'Shift-Ctrl-P': () => {
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
      },
    }));
    return editor;
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

  private _onKeyUp = (_cm: CodeMirror.Editor, event: KeyboardEvent) => {
    const code = event.keyCode;
    if (!this.editor) {
      return;
    }
    if (
      (code >= 65 && code <= 90) || // letters
      (!event.shiftKey && code >= 48 && code <= 57) || // numbers
      (event.shiftKey && code === 189) || // underscore
      (event.shiftKey && code === 222) // "
    ) {
      this.editor.execCommand('autocomplete');
    }
  };

  private _onEdit = () => {
    if (!this.editor) {
      return;
    }
    if (!this.ignoreChangeEvent) {
      this.cachedValue = this.editor.getValue();
      if (this.props.onEdit) {
        this.props.onEdit(this.cachedValue);
      }
    }
  };

  private _onHasCompletion = (
    instance: CM.Editor,
    changeObj?: CM.EditorChange,
  ) => {
    onHasCompletion(instance, changeObj, this.props.onHintInformationRender);
  };
}
