import CodeMirror from 'codemirror';
import { Maybe } from '../types';

export interface SizerComponent {
  getClientHeight: () => number | null;
  getCodeMirror: () => CodeMirror.Editor;
}

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/**
 * When a containing DOM node's height has been altered, trigger a resize of
 * the related CodeMirror instance so that it is always correctly sized.
 */
export default class CodeMirrorSizer {
  public sizes: Array<number | null> = [];

  public updateSizes(components: Array<Maybe<SizerComponent>>) {
    components.forEach((component, i) => {
      if (component) {
        const size = component.getClientHeight();
        if (i <= this.sizes.length && size !== this.sizes[i]) {
          const editor = component.getCodeMirror();
          if (editor) {
            editor.setSize(null, null); // TODO: added the args here. double check no effects. might be version issue
          }
        }
        this.sizes[i] = size;
      }
    });
  }
}
