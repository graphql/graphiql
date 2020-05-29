export const isString = (key: string) => typeof key === 'string';

export const isObjectHasValues = (obj: object) =>
  Boolean(obj) && Boolean(Object.keys(obj).length);

export const isJson = (value: any) => {
  value = !isString(value) ? JSON.stringify(value) : value;
  try {
    value = JSON.parse(value);
  } catch (e) {
    return false;
  }

  return typeof value === 'object' && value !== null;
};
