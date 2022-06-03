/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

export default function find<T>(
  list: Array<T>,
  predicate: (item: T) => boolean,
): T | void {
  for (let i = 0; i < list.length; i++) {
    if (predicate(list[i])) {
      return list[i];
    }
  }
}
