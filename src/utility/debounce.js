/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

/**
 * Provided a duration and a function, returns a new function which is called
 * `duration` milliseconds after the last call.
 */
export default function debounce(duration, fn) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn.apply(this, arguments);
    }, duration);
  };
}
