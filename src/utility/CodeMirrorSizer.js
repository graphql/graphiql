/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import ReactDOM from 'react-dom';


/**
 * When a containing DOM node's height has been altered, trigger a resize of
 * the related CodeMirror instance so that it is always correctly sized.
 */
export default class CodeMirrorSizer {
  constructor() {
    this.sizes = [];
  }

  updateSizes(components) {
    components.forEach((component, i) => {
      const size = ReactDOM.findDOMNode(component).clientHeight;
      if (i <= this.sizes.length && size !== this.sizes[i]) {
        component.getCodeMirror().setSize();
      }
      this.sizes[i] = size;
    });
  }
}
