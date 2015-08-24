/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import React from 'react';
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
  componentDidMount() {
    this.viewer = CodeMirror(React.findDOMNode(this), {
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

  componentWillUnmount() {
    this.viewer = null;
  }

  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }

  componentDidUpdate() {
    this.viewer.setValue(this.props.value || '');
  }

  render() {
    return <div className="result-window" />;
  }
}
