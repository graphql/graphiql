/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { Component, FunctionComponent } from 'react';
import * as CM from 'codemirror';
import ReactDOM from 'react-dom';
import commonKeys from '../utility/commonKeys';
import { SizerComponent } from 'src/utility/CodeMirrorSizer';
import { ImagePreview as ImagePreviewComponent } from './ImagePreview';

type ResultViewerProps = {
  value?: string;
  editorTheme?: string;
  ResultsTooltip?: typeof Component | FunctionComponent;
  ImagePreview: typeof ImagePreviewComponent;
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
  viewer: (CM.Editor & { options: any }) | null = null;
  _node: HTMLElement | null = null;

  componentDidMount() {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const CodeMirror = require('codemirror');
    require('codemirror/addon/fold/foldgutter');
    require('codemirror/addon/fold/brace-fold');
    require('codemirror/addon/dialog/dialog');
    require('codemirror/addon/search/search');
    require('codemirror/addon/search/searchcursor');
    require('codemirror/addon/search/jump-to-line');
    require('codemirror/keymap/sublime');
    require('codemirror-graphql/results/mode');
    const Tooltip = this.props.ResultsTooltip;
    const ImagePreview = this.props.ImagePreview;

    if (Tooltip || ImagePreview) {
      require('codemirror-graphql/utils/info-addon');
      const tooltipDiv = document.createElement('div');
      CodeMirror.registerHelper(
        'info',
        'graphql-results',
        (token: any, _options: any, _cm: CodeMirror.Editor, pos: any) => {
          const infoElements: JSX.Element[] = [];
          if (Tooltip) {
            infoElements.push(<Tooltip pos={pos} />);
          }

          if (
            ImagePreview &&
            typeof ImagePreview.shouldRender === 'function' &&
            ImagePreview.shouldRender(token)
          ) {
            infoElements.push(<ImagePreview token={token} />);
          }

          if (!infoElements.length) {
            ReactDOM.unmountComponentAtNode(tooltipDiv);
            return null;
          }
          ReactDOM.render(<div>{infoElements}</div>, tooltipDiv);
          return tooltipDiv;
        },
      );
    }

    this.viewer = CodeMirror(this._node, {
      lineWrapping: true,
      value: this.props.value || '',
      readOnly: true,
      theme: this.props.editorTheme || 'graphiql',
      mode: 'graphql-results',
      keyMap: 'sublime',
      foldGutter: {
        minFoldSize: 4,
      },
      gutters: ['CodeMirror-foldgutter'],
      info: Boolean(this.props.ResultsTooltip || this.props.ImagePreview),
      extraKeys: commonKeys,
    });
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

  /**
   * Public API for retrieving the CodeMirror instance from this
   * React component.
   */
  getCodeMirror() {
    return this.viewer as CM.Editor;
  }

  /**
   * Public API for retrieving the DOM client height for this component.
   */
  getClientHeight() {
    return this._node && this._node.clientHeight;
  }
}
