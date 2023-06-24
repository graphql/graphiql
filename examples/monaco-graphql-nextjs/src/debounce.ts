export function debounce<F extends (...args: any[]) => any>(
  duration: number,
  fn: F,
) {
  let timeout: number | null;
  return function (this: any, ...args: Parameters<F>) {
    if (timeout) {
      window.clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      timeout = null;
      fn(args);
    }, duration);
  };
}
