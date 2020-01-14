import { Component } from 'react';
import CodeMirror from 'codemirror';
import Maybe from 'graphql/tsutils/Maybe';

interface SizerComponent extends Component {
  getClientHeight: () => number;
  getCodeMirror: () => CodeMirror.Editor;
}

/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/**
 * When a containing DOM node's height has been altered, trigger a resize of
 * the related CodeMirror instance so that it is always correctly sized.
 */
export default class CodeMirrorSizer {
  sizes: number[] = [];

  updateSizes(components: Array<Maybe<SizerComponent>>) {
    components.forEach((component, i) => {
      if (component) {
        const size = component.getClientHeight();
        if (i <= this.sizes.length && size !== this.sizes[i]) {
          component.getCodeMirror().setSize(null, null); // TODO: added the args here. double check no effects. might be version issue
        }
        this.sizes[i] = size;
      }
    });
  }
}
