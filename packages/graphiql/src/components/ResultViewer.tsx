/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as CodeMirror from 'codemirror'

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

type ResultViewerProps = {
  value?: string;
  editorTheme?: string;
  ResultsTooltip?: any;
  ImagePreview?: any;
};

export class ResultViewer extends React.Component<ResultViewerProps, {}> {
  viewer: CodeMorror.Editor
  constructor(props) {
    super(props);
  }
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
    if (this.props.ResultsTooltip || this.props.ImagePreview) {
      require('codemirror-graphql/utils/info-addon');
      const tooltipDiv = document.createElement('div');
      CodeMirror.registerHelper(
        'info',
        'graphql-results',
        (token, options, cm, pos) => {
          const Tooltip = this.props.ResultsTooltip;
          const ImagePreview = this.props.ImagePreview;
          const infoElements = [];
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
          if (infoElements.length > 0) {
            ReactDOM.render(<div>{infoElements}</div>, tooltipDiv);
          }
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
      extraKeys: {
        // Persistent search box in Query Editor
        'Cmd-F': 'findPersistent',
        'Ctrl-F': 'findPersistent',
        'Cmd-G': 'findPersistent',
        'Ctrl-G': 'findPersistent',
        // Editor improvements
        'Ctrl-Left': 'goSubwordLeft',
        'Ctrl-Right': 'goSubwordRight',
        'Alt-Left': 'goGroupLeft',
        'Alt-Right': 'goGroupRight',
      },
    });
  }
  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }
  componentDidUpdate() {
    this.viewer.setValue(this.props.value || '');
  }
  componentWillUnmount() {
    this.viewer = null;
  }
  render() {
    return (
      <div
        className="result-window"
        ref={node => {
          this._node = node;
        }}
      />
    );
  }
  /**
   * Public API for retrieving the CodeMirror instance from this
   * React component.
   */
  getCodeMirror() {
    return this.viewer;
  }
  /**
   * Public API for retrieving the DOM client height for this component.
   */
  getClientHeight() {
    return this._node && this._node.clientHeight;
  }
}
