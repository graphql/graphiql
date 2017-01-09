/* @flow */
/* eslint-disable no-undef */
/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

export default function find<T>(
  list: Array<T>,
  predicate: (item: T) => boolean
): ?T {
  for (let i = 0; i < list.length; i++) {
    if (predicate(list[i])) {
      return list[i];
    }
  }
}
