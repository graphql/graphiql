/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

export default function objectValues(object) {
  const keys = Object.keys(object);
  const len = keys.length;
  const values = new Array(len);
  for (let i = 0; i < len; ++i) {
    values[i] = object[keys[i]];
  }
  return values;
}
