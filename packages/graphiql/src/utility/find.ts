/* @flow */
/**
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { Maybe } from '../types';

export default function find<T>(
  list: Array<T>,
  predicate: (item: T) => boolean,
): Maybe<T> {
  for (let i = 0; i < list.length; i++) {
    if (predicate(list[i])) {
      return list[i];
    }
  }

  return null;
}
