/**
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { Editor } from 'codemirror';

/**
 * An object that knows how to compute its height
 */
interface EditorSizer {
  getClientHeight(): number;
  getCodeMirror(): Editor;
}

/**
 * When a containing DOM node's height has been altered, trigger a resize of
 * the related CodeMirror instance so that it is always correctly sized.
 */
export default class CodeMirrorSizer {
  // the list of sizers we have to listen to
  sizes: number[];

  constructor() {
    this.sizes = [];
  }

  updateSizes(components: EditorSizer[]) {
    components.forEach((component, i) => {
      const size = component.getClientHeight();
      if (i <= this.sizes.length && size !== this.sizes[i]) {
        component.getCodeMirror().setSize(undefined, undefined);
      }
      this.sizes[i] = size;
    });
  }
}
