'use no memo';

/**
 * A debounced function with a `cancel` method that drops any pending call so it
 * can't fire after its owner has been torn down.
 */
export type DebouncedFn<F extends (...args: any[]) => any> = F & {
  cancel: () => void;
};

/**
 * Provided a duration and a function, returns a new function which is called
 * `duration` milliseconds after the last call. Call `.cancel()` to discard a
 * pending invocation (e.g. on unmount, so it can't run against a disposed
 * editor).
 */
export function debounce<F extends (...args: any[]) => any>(
  duration: number,
  fn: F,
): DebouncedFn<F> {
  let timeout: ReturnType<typeof setTimeout> | null;
  const debounced = function (...args: any[]) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      fn(...args);
    }, duration);
  } as DebouncedFn<F>;
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  return debounced;
}
