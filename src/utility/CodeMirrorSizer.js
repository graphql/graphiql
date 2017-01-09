/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

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
      const size = component.getClientHeight();
      if (i <= this.sizes.length && size !== this.sizes[i]) {
        component.getCodeMirror().setSize();
      }
      this.sizes[i] = size;
    });
  }
}
