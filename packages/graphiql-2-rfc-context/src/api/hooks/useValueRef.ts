/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useRef, MutableRefObject } from 'react';

/**
 * useValueRef
 *
 * Returns a reference to a given value. Automatically updates the value of the refrence when the value updates
 *
 */
export default function useValueRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
