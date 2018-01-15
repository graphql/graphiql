export const omitKeys = (obj, keys) =>
  Object.keys(obj).reduce((acc, key) => {
    if (keys.includes(key)) {
      return acc;
    }
    return { ...acc, [key]: obj[key] };
  }, {});
