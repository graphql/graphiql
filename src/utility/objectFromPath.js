//  @flow

export const objectFromPath = (
  path: string,
  value: string | number,
  currentObj: Object = {},
): Object =>
  path.split('.').reduceRight((acc, key, i, arr) => {
    if (i === arr.length - 1) {
      return { [key]: value };
    } else if (i === arr.length - 2) {
      return { [key]: { ...currentObj[key], ...acc } };
    }
    return { ...{ [key]: acc } };
  }, {});
