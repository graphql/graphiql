/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import CodeMirror from 'codemirror';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/keymap/sublime';
import 'codemirror/mode/javascript/javascript';


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
export class ResultViewer extends React.Component {
  static propTypes = {
    value: PropTypes.string
  }

  componentDidMount() {
    this.viewer = CodeMirror(ReactDOM.findDOMNode(this), {
      value: this.props.value || '',
      readOnly: true,
      theme: 'graphiql',
      mode: {
        name: 'javascript',
        json: true
      },
      keyMap: 'sublime',
      foldGutter: {
        minFoldSize: 4
      },
      gutters: [ 'CodeMirror-foldgutter' ],
      extraKeys: {
        // Editor improvements
        'Ctrl-Left': 'goSubwordLeft',
        'Ctrl-Right': 'goSubwordRight',
        'Alt-Left': 'goGroupLeft',
        'Alt-Right': 'goGroupRight',
      }
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
    return <div className="result-window" />;
  }
}
