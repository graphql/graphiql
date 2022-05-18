/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { ImagePreview } from '@graphiql/react';
import React, { ComponentType } from 'react';
import type { Editor, Position, Token } from 'codemirror';
import ReactDOM from 'react-dom';
import commonKeys from '../utility/commonKeys';
import { SizerComponent } from '../utility/CodeMirrorSizer';
import { importCodeMirror } from '../utility/importCodeMirror';
import { CodeMirrorEditor } from '../types';

export type ResultTooltipType = ComponentType<{ pos: Position }>;

type ResultViewerProps = {
  value?: string;
  editorTheme?: string;
  ResultsTooltip?: ResultTooltipType;
  registerRef: (node: HTMLElement) => void;
};

/**
 * ResultViewer
 *
 * Maintains an instance of CodeMirror for viewing a GraphQL response.
 *
 * Props:
 *
 *   - value: The text of the editor.
 *
 */
export class ResultViewer extends React.Component<ResultViewerProps, {}>
  implements SizerComponent {
  viewer: CodeMirrorEditor | null = null;
  _node: HTMLElement | null = null;

  componentDidMount() {
    this.initializeEditor();
  }

  shouldComponentUpdate(nextProps: ResultViewerProps) {
    return this.props.value !== nextProps.value;
  }

  componentDidUpdate() {
    if (this.viewer) {
      this.viewer.setValue(this.props.value || '');
    }
  }

  componentWillUnmount() {
    this.viewer = null;
  }

  render() {
    return (
      <section
        className="result-window"
        aria-label="Result Window"
        aria-live="polite"
        aria-atomic="true"
        ref={node => {
          if (node) {
            this.props.registerRef(node);
            this._node = node;
          }
        }}
      />
    );
  }

  allAddons = () => [
    import('codemirror/addon/fold/foldgutter'),
    import('codemirror/addon/fold/brace-fold'),
    import('codemirror/addon/dialog/dialog'),
    import('codemirror/addon/search/search'),
    import('codemirror/addon/search/searchcursor'),
    import('codemirror/addon/search/jump-to-line'),
    // @ts-expect-error
    import('codemirror/keymap/sublime'),
    import('codemirror-graphql/results/mode'),
  ];

  async initializeEditor() {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const CodeMirror = await importCodeMirror(this.allAddons(), {
      useCommonAddons: false,
    });
    const Tooltip = this.props.ResultsTooltip;

    if (Tooltip || ImagePreview) {
      await import('codemirror-graphql/utils/info-addon');
      const tooltipDiv = document.createElement('div');
      CodeMirror.registerHelper(
        'info',
        'graphql-results',
        (token: Token, _options: any, _cm: Editor, pos: Position) => {
          const infoElements: JSX.Element[] = [];
          if (Tooltip) {
            infoElements.push(<Tooltip pos={pos} />);
          }

          if (ImagePreview.shouldRender(token)) {
            infoElements.push(
              <ImagePreview key="image-preview" token={token} />,
            );
          }

          if (!infoElements.length) {
            ReactDOM.unmountComponentAtNode(tooltipDiv);
            return null;
          }
          ReactDOM.render(infoElements, tooltipDiv);
          return tooltipDiv;
        },
      );
    }

    this.viewer = CodeMirror(this._node!, {
      lineWrapping: true,
      value: this.props.value || '',
      readOnly: true,
      theme: this.props.editorTheme || 'graphiql',
      mode: 'graphql-results',
      keyMap: 'sublime',
      foldGutter: {
        // @ts-expect-error
        minFoldSize: 4,
      },
      gutters: ['CodeMirror-foldgutter'],
      info: true,
      extraKeys: commonKeys,
    }) as CodeMirrorEditor;
  }

  /**
   * Public API for retrieving the CodeMirror instance from this
   * React component.
   */
  getCodeMirror() {
    return this.viewer as Editor;
  }

  /**
   * Public API for retrieving the DOM client height for this component.
   */
  getClientHeight() {
    return this._node && this._node.clientHeight;
  }
}
