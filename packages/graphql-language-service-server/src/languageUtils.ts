import { Position, Range } from 'graphql-language-service-utils';

type StrRange = {
  start: number;
  end: number;
  line: number;
};

type Location = {
  line: number;
  column: number;
  character: number;
};

export type GraphQLSource = {
  template: string;
  range: Range;
};

export function getLocator(source: string) {
  const offsetLine = 0;
  const offsetColumn = 0;

  const originalLines = source.split('\n');

  let start = 0;
  const lineRanges = originalLines.map((line, i) => {
    const end = start + line.length + 1;
    const range: StrRange = { start, end, line: i };

    start = end;
    return range;
  });

  let i = 0;

  function rangeContains(range: StrRange, index: number) {
    return range.start <= index && index < range.end;
  }

  function getLocation(range: StrRange, index: number): Location {
    return {
      line: offsetLine + range.line,
      column: offsetColumn + index - range.start,
      character: index,
    };
  }

  function locateStr(search: number): Location {
    let range = lineRanges[i];

    const d = search >= range.end ? 1 : -1;

    while (range) {
      if (rangeContains(range, search)) {
        return getLocation(range, search);
      }

      i += d;
      range = lineRanges[i];
    }

    throw new Error('Location not found.');
  }

  return locateStr;
}

export function locate(source: string, search: any): Location {
  return getLocator(source)(search);
}

/**
 * A helper for extracting GraphQL operations from source via a regexp.
 * It assumes that the only thing the regexp matches is the actual content,
 * so if that's not true for your regexp you probably shouldn't use this
 * directly.
 */
export const makeExtractTagsFromSource = (
  regexp: RegExp,
): ((text: string) => ReadonlyArray<GraphQLSource>) => (
  text: string,
): ReadonlyArray<GraphQLSource> => {
  const locator = getLocator(text);
  const sources: Array<GraphQLSource> = [];
  let result;

  while ((result = regexp.exec(text)) !== null) {
    if (result) {
      const start = locator(result.index);
      const end = locator(result.index + result[0].length);

      sources.push({
        template: result[0],
        range: new Range(
          new Position(start.line, start.column),
          new Position(end.line, end.column),
        ),
      });
    }
  }

  // Reset RegExp
  regexp.lastIndex = 0;

  return [...sources];
};
