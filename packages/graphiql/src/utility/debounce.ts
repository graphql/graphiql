/**
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { Maybe } from '../types';

/**
 * Provided a duration and a function, returns a new function which is called
 * `duration` milliseconds after the last call.
 */
export default function debounce(duration: number, fn: Function) {
  let timeout: Maybe<NodeJS.Timeout>;

  return function() {
    // if we have a timeout to clear
    if (timeout) {
      clearTimeout(timeout);
    }

    // create
    timeout = setTimeout(function() {
      timeout = null;
      fn.apply(this, arguments);
    }, duration);
  };
}
