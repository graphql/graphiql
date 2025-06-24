/**
 * `pick`-like utility that extracts specific keys from an object.
 */
export function pick<T, K extends keyof T>(...keys: K[]) {
  return (obj: T): Pick<T, K> => {
    const result = Object.create(null);
    for (const key of keys) {
      result[key] = obj[key];
    }
    return result;
  };
}
