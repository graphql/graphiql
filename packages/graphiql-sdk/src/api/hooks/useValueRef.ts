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
