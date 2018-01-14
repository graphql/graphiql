//  @flow

export const objectFromPath = (path: string, value: string | number): Object =>
  path.split('.').reduceRight((acc, key, i, arr) => {
    if (i === arr.length - 1) {
      return { [key]: value };
    }
    return { ...{ [key]: acc } };
  }, {});
