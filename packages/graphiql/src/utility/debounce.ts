export type DebounceFn<T> = T & {
  clear(): void;
};

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/**
 * Provided a duration and a function, returns a new function which is called
 * `duration` milliseconds after the last call.
 */
export default function debounce<F extends (...args: any[]) => any>(
  duration: number,
  fn: F,
): DebounceFn<F> {
  let timeout: number | null;
  return Object.assign(
    function (this: any, ...args: Parameters<F>) {
      if (timeout) {
        window.clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        timeout = null;
        fn.apply(this, args);
      }, duration);
    } as DebounceFn<F>,
    {
      clear() {
        if (timeout) {
          window.clearTimeout(timeout);
        }
      },
    },
  );
}
